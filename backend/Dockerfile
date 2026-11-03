FROM python:3.12-slim

# uv из официального образа
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Сначала зависимости — кэш слоя
COPY backend/pyproject.toml ./
RUN uv sync --no-dev --no-install-project

# Потом код
COPY backend/app ./app

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]