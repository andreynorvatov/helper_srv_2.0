# Helper Service 2.0

Веб-приложение: **FastAPI** (бек) + **React/Vite/TypeScript/Tailwind** (фронт).
Бек получает данные из внешних API (ключи в `.env`), фронт отображает и считает на клиенте.

## Структура

```
backend/    FastAPI + uv
frontend/   React + Vite + TS + Tailwind (pnpm)
docker/     nginx.conf
scripts/    deploy.sh
```

## Локальная разработка (без Docker)

Требования: Python 3.12 + [uv](https://docs.astral.sh/uv/), Node 22 + [pnpm](https://pnpm.io/).

### Бек

```bash
cd backend
uv sync
cp .env.example .env   # впиши ключи внешних API
uv run uvicorn app.main:app --reload --port 8000
```

Доступно: http://localhost:8000/docs (Swagger), http://localhost:8000/health

### Фронт

```bash
cd frontend
pnpm install
pnpm dev
```

Доступно: http://localhost:5173 — Vite проксирует `/api` на `localhost:8000`.

## Деплой на сервер (Docker)

Требования на сервере: Docker + Docker Compose, доступ по SSH.

1. Склонировать репо на сервер.
2. Создать `.env` из `.env.example`, вписать ключи.
3. Запустить:

```bash
./scripts/deploy.sh
```

Сервис поднимется на `http://<IP-сервера>:80` (порт из `HTTP_PORT`).

## Внешние API

Бек — прокси для внешних источников. Фронт не знает ключей.

Запрос: `GET /api/v1/fetch?source=NAME`

Источники настраиваются в `.env`:

```
EXTERNAL_API_URL_<NAME>=https://...
EXTERNAL_API_KEY_<NAME>=secret
```

Подробнее — в [`AGENTS.md`](AGENTS.md).