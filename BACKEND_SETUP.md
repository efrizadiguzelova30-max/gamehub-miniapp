# GameHub backend foundation (not deployed)

This is a backend starting point, not a deployed admin panel. GitHub Pages only serves public static files; it cannot securely enforce roles or make the static site private.

## Included
- admin-worker.js: server-side Telegram Mini App initData HMAC validation (maximum age one hour), owner-only site-lock and bot-state controls, owner-only admin/co-owner management, parameterized D1 queries, audit log, origin checks, body size limits, and no-store responses.
- migrations/0001_admin.sql and migrations/0002_groups.sql: database tables for roles, settings, audit logs, and managed Telegram groups.
- wrangler.toml.example: Cloudflare Worker and D1 binding template.
- Telegram webhook route: basic /start, /help, /status and /groupid commands; it checks a dedicated webhook secret and honors the bot_enabled setting.

## Required before deployment
1. Create a Cloudflare D1 database and Worker. Copy wrangler.toml.example to wrangler.toml, replace the database ID, and apply the SQL migration.
2. Set secrets using Wrangler: BOT_TOKEN, OWNER_TELEGRAM_ID (the numeric Telegram ID of the actual owner), and TELEGRAM_WEBHOOK_SECRET (a random secret used only for Telegram webhook verification). Never put these secrets in public HTML/JS or Git.
3. Deploy the Worker. The current frontend is not yet connected to this API.
4. The Telegram bot service must independently check bot_enabled before handling commands. This flag records desired state; it does not stop a separate process by itself.
6. Integrate a maintenance overlay in the frontend and enforce the locked state in every protected backend endpoint. GitHub Pages files remain public; this does not hide the static URL.
6. Register the Telegram webhook URL ending in /telegram/webhook and set the same secret with Telegram's secret_token option. Configure edge rate limits before public launch.

## Endpoints
- GET /api/site-status — public site-lock and bot flags.
- GET /api/admin/status — actor and flags; requires Telegram WebApp initData header.
- POST /api/admin/site-lock with JSON locked=true/false — owner only.
- POST /api/admin/bot with JSON enabled=true/false — owner only.
- GET /api/admin/admins — owner only.
- POST /api/admin/admins with JSON telegramId and role=admin or co_owner — owner only.
- DELETE /api/admin/admins?telegramId=123456 — owner only.
- GET /api/admin/groups — any authenticated GameHub admin/co-owner/owner.
- POST /api/admin/groups with chatId and title — owner or co-owner.
- DELETE /api/admin/groups?chatId=-1001234567890 — owner or co-owner.
- POST /api/admin/group-action with chatId, userId and action=ban|unban — authenticated admin; the bot must have suitable Telegram group permissions.
- POST /telegram/webhook — Telegram webhook secured by TELEGRAM_WEBHOOK_SECRET; currently implements basic bot commands only.

Send Telegram WebApp initData in X-Telegram-Init-Data, never initDataUnsafe. Do not weaken authentication or hardcode a test token.
