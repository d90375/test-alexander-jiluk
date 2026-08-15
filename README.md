# Тестовые задания

Два проекта, каждый запускается независимо — инструкции в README внутри папки.

| Папка | Задание | Стек |
|---|---|---|
| [payment-webhook](./payment-webhook) | Обработка оплаты подписки: вебхук от банка, идемпотентность, атомарная активация | FastAPI, PostgreSQL, SQLAlchemy, Alembic |
| [consultant-chat](./consultant-chat) | Страница «Чат с консультантом»: SSR-список встреч и WebSocket-чат с переподключением | Next.js (App Router), TypeScript, TanStack Query, Tailwind |

- [payment-webhook/README.md](./payment-webhook/README.md) — запуск через docker-compose, принятые решения
- [consultant-chat/README.md](./consultant-chat/README.md) — запуск дева и echo-сервера, граница server/client компонентов
