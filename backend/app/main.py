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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=BACKEND_PORT, reload=True)