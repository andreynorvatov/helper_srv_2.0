# ТЗ: Фронтенд Helper Service

## 1. Цель

Переписать фронтенд с заглушки на полноценный интерфейс с вкладками:
дашборд-панель с набором утилит и сбором данных с внешних ресурсов.
Начать с чистого листа — текущий код `Home.tsx` (health-check, fetch-прокси)
удаляется.

## 2. Стек

- React 18 + Vite 6 + TypeScript 5.6
- Tailwind CSS 4 (через `@tailwindcss/vite`)
- pnpm (Node 22)
- Без UI-кита, без роутера, без стейт-менеджера, без тестов

## 3. Структура

```
frontend/src/
  App.tsx                    # useState активной вкладки, рендер вкладки
  main.tsx                   # без изменений
  index.css                  # без изменений
  types/
    index.ts                 # Balance, TabId, FetchResponse
  hooks/
    useBalance.ts            # мок баланса
    useFetch.ts              # fetch /api/v1/fetch?source=NAME
  components/
    Layout.tsx               # переделать: шапка с вкладками, контент, футер
    tabs/
      BalanceTab.tsx         # вкладка «Баланс»
      ProfileTab.tsx         # вкладка «Расчёт профиля»
      FetchTab.tsx           # вкладка «Сбор данных»
      ApiDocsTab.tsx         # вкладка «API Docs»
    ui/
      Card.tsx               # переиспользуемая карточка
      Button.tsx             # переиспользуемая кнопка
      Tabs.tsx               # переиспользуемый набор вкладок
  pages/
    Home.tsx                 # переписать: страница с вкладками
```

## 4. Вкладки

Одна страница, переключение вкладок без роутера. Состояние активной вкладки —
`useState` в `App.tsx`. `Layout` — презентационный: принимает `activeTab`,
`onTabChange`, `children`. `App` рендерит компонент активной вкладки.

### 4.1 Баланс (BalanceTab)

- Показывает мок-данные баланса OpenRouter.
- `useBalance` возвращает мок `Balance`, без fetch (эндпоинт не готов).
- Отображение: credits, limit, usage.

### 4.2 Расчёт профиля (ProfileTab)

- Форма: 3 числовых поля (a, b, c).
- Кнопка «Рассчитать».
- Результат = `a + b + c`.
- Формула — заглушка, позже заменится.

### 4.3 Сбор данных (FetchTab)

- Поле source + кнопка «Запросить».
- `useFetch` → `GET /api/v1/fetch?source=NAME`.
- Вывод JSON в `<pre>`, состояния loading и error.

### 4.4 API Docs (ApiDocsTab)

- Один iframe на `/docs` (Swagger UI).
- ReDoc не нужен.

## 5. Типы

```ts
export type TabId = 'balance' | 'profile' | 'fetch' | 'docs'

export interface Balance {
  credits: number
  limit: number
  usage: number
}

export interface FetchResponse {
  [key: string]: unknown
}
```

## 6. Хуки

- `useBalance()` — возвращает мок `Balance`. Код готов к будущему
  `GET /api/v1/balance` → `{ credits, limit, usage }`.
- `useFetch(source)` — запрос `GET /api/v1/fetch?source=NAME`, возвращает
  `{ data, error, loading }`. Обработка HTTP-ошибок и `detail` из тела ответа.

## 7. Сбор данных

Отдельная вкладка «Сбор данных» (FetchTab). Логика fetch-прокси — в `useFetch`.
Поле source + кнопка + вывод JSON в `<pre>`, с состояниями loading и error.

## 8. Стили

- Только Tailwind-классы, без отдельных CSS-файлов.
- Чистый Tailwind, без UI-библиотек.
- Типы TypeScript обязательны, без `any` без явной причины.

## 9. Критерии готовности

- `pnpm build` (tsc + vite) проходит без ошибок.
- `docker compose build` проходит.
- Вкладки переключаются, каждая рендерит свой контент.
- Мок баланса отображается, расчёт профиля считает сумму, iframe `/docs`
  открывается.

## 10. Вне рамок

- Бек-эндпоинт `/api/v1/balance` — не в этой задаче (фронт готов к нему).
- Реальная формула расчёта профиля — позже.
- Тесты, роутер, стейт-менеджер, UI-кит — не нужны.