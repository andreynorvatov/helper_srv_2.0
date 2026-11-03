"""Конфигурация приложения: чтение env, регистрация внешних источников."""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ExternalSource:
    """Описание внешнего API-источника."""

    name: str
    url: str
    api_key: str | None = None


def _load_external_sources() -> dict[str, ExternalSource]:
    """Собирает источники из env-переменных вида:

    EXTERNAL_API_URL_<NAME>=https://...
    EXTERNAL_API_KEY_<NAME>=secret
    """
    sources: dict[str, ExternalSource] = {}
    prefix = "EXTERNAL_API_URL_"
    for key, value in os.environ.items():
        if not key.startswith(prefix):
            continue
        name = key[len(prefix) :].lower()
        api_key = os.environ.get(f"EXTERNAL_API_KEY_{name.upper()}")
        sources[name] = ExternalSource(name=name, url=value, api_key=api_key)
    return sources


# Внешние источники, зарегистрированные в .env
EXTERNAL_SOURCES: dict[str, ExternalSource] = _load_external_sources()

# Порт, на котором слушает uvicorn (внутри контейнера)
BACKEND_PORT = int(os.environ.get("BACKEND_PORT", "8000"))

# Разрешённые origin для CORS (dev: Vite)
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")