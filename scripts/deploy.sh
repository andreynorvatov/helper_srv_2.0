#!/usr/bin/env bash
# Деплой на сервер: git pull → build → up -d → health check
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> git pull"
git pull

echo "==> docker compose build"
docker compose build

echo "==> docker compose up -d"
docker compose up -d

echo "==> health check"
sleep 3
HTTP_PORT="${HTTP_PORT:-80}"
if curl -fsS "http://localhost:${HTTP_PORT}/health"; then
  echo
  echo "OK: сервис поднят на http://localhost:${HTTP_PORT}"
else
  echo "WARN: health check не прошёл — смотри docker compose logs"
  exit 1
fi