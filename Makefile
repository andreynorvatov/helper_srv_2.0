.PHONY: help install dev dev-backend dev-frontend build up down logs health deploy

help:
	@echo "Цели:"
	@echo "  make install        — установить зависимости (uv sync + pnpm install)"
	@echo "  make dev            — запустить бек + фронт локально (без Docker)"
	@echo "  make dev-backend    — только бек (uvicorn --reload :8000)"
	@echo "  make dev-frontend   — только фронт (vite :5173)"
	@echo "  make build          — docker compose build"
	@echo "  make up             — build + docker compose up -d (одна команда для проверки)"
	@echo "  make down           — docker compose down"
	@echo "  make logs           — логи контейнеров"
	@echo "  make health         — curl /health"
	@echo "  make deploy         — деплой на сервер (scripts/deploy.sh)"

install:
	cd backend && uv sync
	cd frontend && pnpm install

dev:
	@trap 'kill 0' INT TERM EXIT; \
	cd backend && uv run uvicorn app.main:app --reload --port 8000 & \
	cd frontend && pnpm dev

dev-backend:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && pnpm dev

build:
	docker compose build

up: build
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

health:
	curl -fsS http://localhost:${HTTP_PORT:-80}/health

deploy:
	./scripts/deploy.sh