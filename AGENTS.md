# Инструкции для агента

Этот файл — главный источник правил для агента, разрабатывающего приложение.
Читай его перед началом работы и следуй всегда.

## Стек

| Слой | Технология | Менеджер |
|---|---|---|
| Бек | FastAPI (Python 3.12) | uv |
| Фронт | React + Vite + TypeScript + Tailwind | pnpm (Node 22) |
| Прод | Docker Compose: nginx (статика + прокси) + backend | — |

## Структура

```
backend/    app/main.py (FastAPI), app/config.py (env), pyproject.toml
frontend/   src/ (React), vite.config.ts (прокси /api), package.json
docker/     nginx.conf — раздача статики + прокси /api → backend:8000
scripts/    deploy.sh — деплой на сервер
```

## Команды

### Бек (локально)

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

### Фронт (локально)

```bash
cd frontend
pnpm install
pnpm dev
```

Vite dev-сервер проксирует `/api/*` на `http://localhost:8000` — CORS не нужен в dev.

### Деплой (на сервере)

```bash
./scripts/deploy.sh
```

Скрипт: `git pull` → `docker compose build` → `docker compose up -d`.

## Правила разработки

1. **Секреты — только в `.env`.** Никогда не хардкодь ключи, URL с токенами, пароли.
   `.env` в git не попадает (см. `.gitignore`). Образцы — в `.env.example`.
2. **Фронт не ходит во внешние API напрямую.** Все внешние запросы — через бек
   (`GET /api/v1/fetch?source=NAME`). Ключи живут на сервере.
3. **Новый внешний источник** = новый блок в `.env` (`EXTERNAL_API_URL_<NAME>`,
   `EXTERNAL_API_KEY_<NAME>`) + регистрация в `app/config.py` (см. `EXTERNAL_SOURCES`).
   Код менять не нужно — конфиг читается из env.
4. **API-пути фронта** начинаются с `/api/`. В dev их проксирует Vite, в проде — nginx.
5. **Типы TypeScript** — обязательны. Без `any` без явной причины.
6. **Стили** — только Tailwind-классы. Не пиши отдельные CSS-файлы без нужды.
7. **Проверка перед деплоем:** бек `uv run uvicorn ...` стартует без ошибок,
   фронт `pnpm build` собирается, `docker compose build` проходит.
8. **Не ломай деплой-конфиги** (docker-compose.yml, nginx.conf, Dockerfile) без
   явной необходимости. Если меняешь — проверь `docker compose config`.

## Темы фронтенда

Фронт поддерживает светлую и тёмную темы. Правила обязательны для всех
новых и изменяемых компонентов.

- Тёмная тема — класс `.dark` на `<html>` (`@custom-variant dark` в
  `frontend/src/index.css`). Цвета — семантические CSS-переменные в `:root`
  (светлые) и `.dark` (тёмные), маппинг в Tailwind-утилиты через `@theme inline`.
- Управление — `useTheme` + `ThemeProvider` (`frontend/src/hooks/useTheme.tsx`),
  переключатель — `ThemeToggle` (`frontend/src/components/ui/ThemeToggle.tsx`).
  Дефолт — системная тема, кнопка-иконка переключает на противоположную.
  Выбор в `localStorage` (ключ `theme`). Инлайн-скрипт в `frontend/index.html`
  ставит `.dark` до рендера — без FOUC.
- **Не хардкодь** `bg-white`, `text-slate-*`, `bg-slate-*` и т.п. — только
  семантические утилиты: `bg-background`, `bg-surface`, `text-foreground`,
  `text-muted`, `border-border`, `bg-primary`/`text-primary-foreground`,
  `bg-sidebar`/`text-sidebar-foreground`, `bg-sidebar-active`.
- Новый цвет → добавь переменную в `:root` и `.dark` в `index.css`, затем
  утилиту в `@theme inline`. Проверяй контраст в обеих темах.

## Как добавить функционал

1. Понять, где живёт фича: бек (данные/логика сервера) или фронт (отображение/расчёты).
2. Бек: эндпоинт в `app/main.py` или новый роутер в `app/`. Данные из внешки — через fetch-прокси.
3. Фронт: компонент в `frontend/src/components/`, страница в `frontend/src/pages/`.
4. Проверить локально (см. «Команды»), затем деплой.

## Деплой-чеклист

- [ ] `.env` на сервере актуален (ключи есть)
- [ ] `docker compose config` валиден
- [ ] `./scripts/deploy.sh` отработал без ошибок
- [ ] `curl http://<IP>/health` → `{"status":"ok"}`
- [ ] Фронт открывается, запросы через `/api` работают