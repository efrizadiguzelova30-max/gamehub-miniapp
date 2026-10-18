# GameHub backend foundation (not deployed)

This is a backend starting point, not a deployed admin panel. GitHub Pages only serves public static files; it cannot securely enforce roles or make the static site private.

## Included
- admin-worker.js: server-side Telegram Mini App initData HMAC validation (maximum age one hour), owner-only site-lock and bot-state controls, owner-only admin/co-owner management, parameterized D1 queries, audit log, origin checks, body size limits, and no-store responses.
- migrations/0001_admin.sql: database tables.
- wrangler.toml.example: Cloudflare Worker and D1 binding template.

## Required before deployment
1. Create a Cloudflare D1 database and Worker. Copy wrangler.toml.example to wrangler.toml, replace the database ID, and apply the SQL migration.
2. Set secrets using Wrangler: BOT_TOKEN and OWNER_TELEGRAM_ID (the numeric Telegram ID of the actual owner). Never put these secrets in public HTML/JS or Git.
3. Deploy the Worker. The current frontend is not yet connected to this API.
4. The Telegram bot service must independently check bot_enabled before handling commands. This flag records desired state; it does not stop a separate process by itself.
5. Integrate a maintenance overlay in the frontend and enforce the locked state in every protected backend endpoint. GitHub Pages files remain public; this does not hide the static URL.
6. Configure edge rate limits before public launch.

## Endpoints
- GET /api/site-status — public site-lock and bot flags.
- GET /api/admin/status — actor and flags; requires Telegram WebApp initData header.
- POST /api/admin/site-lock with JSON locked=true/false — owner only.
- POST /api/admin/bot with JSON enabled=true/false — owner only.
- GET /api/admin/admins — owner only.
- POST /api/admin/admins with JSON telegramId and role=admin or co_owner — owner only.
- DELETE /api/admin/admins?telegramId=123456 — owner only.

Send Telegram WebApp initData in X-Telegram-Init-Data, never initDataUnsafe. Do not weaken authentication or hardcode a test token.
