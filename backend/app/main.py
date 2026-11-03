"""FastAPI приложение: health-check и fetch-прокси к внешним API."""

import asyncio

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import BACKEND_PORT, CORS_ORIGINS, EXTERNAL_SOURCES

app = FastAPI(title="Helper Service 2.0", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Проверка живости сервиса."""
    return {"status": "ok"}


@app.get("/api/v1/fetch")
async def fetch_external(
    source: str = Query(..., description="Имя источника из .env, например: weather"),
    path: str = Query("", description="Дополнительный путь к ресурсу внутри источника"),
) -> dict:
    """Прокси-запрос к внешнему API.

    Фронт не знает ключей — все внешние запросы идут через этот эндпоинт.
    Источник регистрируется в .env: EXTERNAL_API_URL_<NAME>, EXTERNAL_API_KEY_<NAME>.
    """
    src = EXTERNAL_SOURCES.get(source.lower())
    if src is None:
        available = ", ".join(sorted(EXTERNAL_SOURCES)) or "нет источников в .env"
        raise HTTPException(
            status_code=404,
            detail=f"Источник '{source}' не найден. Доступно: {available}",
        )

    url = f"{src.url.rstrip('/')}/{path.lstrip('/')}"
    headers = {"Authorization": f"Bearer {src.api_key}"} if src.api_key else {}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Внешний API вернул ошибку: {exc.response.text[:500]}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Ошибка запроса к внешнему API: {exc}") from exc

    return resp.json()


async def _openrouter_get(src, path: str) -> dict:
    """GET к OpenRouter и разбор обёртки {"data": {...}}."""
    url = f"{src.url.rstrip('/')}/{path.lstrip('/')}"
    headers = {"Authorization": f"Bearer {src.api_key}"} if src.api_key else {}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"OpenRouter вернул ошибку: {exc.response.text[:500]}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Ошибка запроса к OpenRouter: {exc}") from exc

    payload = resp.json()
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=502,
            detail="OpenRouter вернул неожиданный формат ответа (нет поля data)",
        )
    return data


async def _get_usd_rub_rate() -> float | None:
    """Текущий курс USD → RUB из источника exchange (open.er-api.com).

    Сбой или отсутствие источника → None (баланс не роняем).
    """
    src = EXTERNAL_SOURCES.get("exchange")
    if src is None:
        return None

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(src.url)
            resp.raise_for_status()
            payload = resp.json()
    except (httpx.HTTPError, ValueError):
        return None

    rate = payload.get("rates", {}).get("RUB") if isinstance(payload, dict) else None
    try:
        return float(rate)
    except (TypeError, ValueError):
        return None


def _to_rub(usd: float | None, rate: float | None) -> int | None:
    """Конвертация USD → RUB, округление до целых. Нет курса → None."""
    if usd is None or rate is None:
        return None
    return round(usd * rate)


@app.get("/api/v1/balance")
async def openrouter_balance() -> dict:
    """Баланс OpenRouter.

    Фронт не знает ключей — запрос идёт через бек. Источник регистрируется
    в .env: EXTERNAL_API_URL_OPENROUTER, EXTERNAL_API_KEY_OPENROUTER.
    Объединяет данные двух эндпоинтов OpenRouter:
      - GET /auth/key — данные ключа (label, limit, usage по периодам);
      - GET /credits  — баланс аккаунта (total_credits, total_usage).
    Курс USD → RUB тянется параллельно из источника exchange (open.er-api.com);
    при сбое курса баланс всё равно отдаётся (usd_rub_rate: null, rub_*: null).
    Ответ нормализуется в удобную для фронта структуру.
    """
    src = EXTERNAL_SOURCES.get("openrouter")
    if src is None:
        raise HTTPException(
            status_code=404,
            detail="Источник 'openrouter' не найден. Добавь EXTERNAL_API_URL_OPENROUTER "
            "и EXTERNAL_API_KEY_OPENROUTER в .env",
        )

    key_task = _openrouter_get(src, "/auth/key")
    credits_task = _openrouter_get(src, "/credits")
    rate_task = _get_usd_rub_rate()

    results = await asyncio.gather(
        key_task, credits_task, rate_task, return_exceptions=True
    )

    key_data, credits_data, rate = results[0], results[1], results[2]
    if isinstance(key_data, BaseException) or isinstance(credits_data, BaseException):
        # Пробрасываем первую реальную ошибку OpenRouter (курс сбой не роняет баланс)
        exc = key_data if isinstance(key_data, BaseException) else credits_data
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=502, detail=f"Ошибка запроса к OpenRouter: {exc}") from exc
    if isinstance(rate, BaseException):
        rate = None

    limit = float(key_data.get("limit") or 0)
    usage = float(key_data.get("usage") or 0)

    # limit == 0 означает безлимитный ключ (pay-as-you-go) — «остаток» не применим.
    credits = round(limit - usage, 6) if limit > 0 else None

    total_credits = float(credits_data.get("total_credits") or 0)
    total_usage = float(credits_data.get("total_usage") or 0)
    remaining_credits = round(total_credits - total_usage, 6)

    usage_daily = float(key_data.get("usage_daily") or 0)
    usage_weekly = float(key_data.get("usage_weekly") or 0)
    usage_monthly = float(key_data.get("usage_monthly") or 0)

    return {
        "label": key_data.get("label"),
        "limit": limit,
        "usage": usage,
        "usage_daily": usage_daily,
        "usage_weekly": usage_weekly,
        "usage_monthly": usage_monthly,
        "credits": credits,
        "is_free_tier": bool(key_data.get("is_free_tier", False)),
        # Баланс аккаунта (из /credits)
        "total_credits": total_credits,
        "total_usage": total_usage,
        "remaining_credits": remaining_credits,
        # Курс USD → RUB и рублёвые эквиваленты (null при сбое курса)
        "usd_rub_rate": rate,
        "rub_credits": _to_rub(credits, rate),
        "rub_limit": _to_rub(limit, rate),
        "rub_usage": _to_rub(usage, rate),
        "rub_usage_daily": _to_rub(usage_daily, rate),
        "rub_usage_weekly": _to_rub(usage_weekly, rate),
        "rub_usage_monthly": _to_rub(usage_monthly, rate),
        "rub_total_credits": _to_rub(total_credits, rate),
        "rub_total_usage": _to_rub(total_usage, rate),
        "rub_remaining_credits": _to_rub(remaining_credits, rate),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=BACKEND_PORT, reload=True)