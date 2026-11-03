"""FastAPI приложение: health-check и fetch-прокси к внешним API."""

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


@app.get("/api/v1/balance")
async def openrouter_balance() -> dict:
    """Баланс OpenRouter.

    Фронт не знает ключей — запрос идёт через бек. Источник регистрируется
    в .env: EXTERNAL_API_URL_OPENROUTER, EXTERNAL_API_KEY_OPENROUTER.
    Объединяет данные двух эндпоинтов OpenRouter:
      - GET /auth/key — данные ключа (label, limit, usage по периодам);
      - GET /credits  — баланс аккаунта (total_credits, total_usage).
    Ответ нормализуется в удобную для фронта структуру.
    """
    src = EXTERNAL_SOURCES.get("openrouter")
    if src is None:
        raise HTTPException(
            status_code=404,
            detail="Источник 'openrouter' не найден. Добавь EXTERNAL_API_URL_OPENROUTER "
            "и EXTERNAL_API_KEY_OPENROUTER в .env",
        )

    key_data = await _openrouter_get(src, "/auth/key")
    credits_data = await _openrouter_get(src, "/credits")

    limit = float(key_data.get("limit") or 0)
    usage = float(key_data.get("usage") or 0)

    # limit == 0 означает безлимитный ключ (pay-as-you-go) — «остаток» не применим.
    credits = round(limit - usage, 6) if limit > 0 else None

    total_credits = float(credits_data.get("total_credits") or 0)
    total_usage = float(credits_data.get("total_usage") or 0)

    return {
        "label": key_data.get("label"),
        "limit": limit,
        "usage": usage,
        "usage_daily": float(key_data.get("usage_daily") or 0),
        "usage_weekly": float(key_data.get("usage_weekly") or 0),
        "usage_monthly": float(key_data.get("usage_monthly") or 0),
        "credits": credits,
        "is_free_tier": bool(key_data.get("is_free_tier", False)),
        # Баланс аккаунта (из /credits)
        "total_credits": total_credits,
        "total_usage": total_usage,
        "remaining_credits": round(total_credits - total_usage, 6),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=BACKEND_PORT, reload=True)