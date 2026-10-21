# GameHub backend foundation (not deployed)

This is a backend starting point, not a deployed admin panel. GitHub Pages only serves public static files; it cannot securely enforce roles or make the static site private.

## Included
- admin-worker.js: server-side Telegram Mini App initData HMAC validation (maximum age one hour), owner-only site-lock and bot-state controls, owner-only admin/co-owner management, parameterized D1 queries, audit log, origin checks, body size limits, and no-store responses.
- migrations/0001_admin.sql, migrations/0002_groups.sql and migrations/0004_access_keys.sql: database tables for roles, settings, audit logs, and managed Telegram groups.
- wrangler.toml.example: Cloudflare Worker and D1 binding template.
- Telegram webhook route: basic /start, /help, /status and /groupid commands; it checks a dedicated webhook secret and honors the bot_enabled setting.

## Required before deployment
1. Create a Cloudflare D1 database and Worker. Copy wrangler.toml.example to wrangler.toml, replace the database ID, and apply the SQL migration.
2. Set secrets using Wrangler: BOT_TOKEN, OWNER_TELEGRAM_ID (set to `7271410328` for this project owner), and TELEGRAM_WEBHOOK_SECRET (a random secret used only for Telegram webhook verification). Never put these secrets in public HTML/JS or Git.
3. Apply all migrations including `0004_access_keys.sql`, then deploy the Worker. Set the `ACCESS_KEY_BOT_SECRET` Worker secret if you want to manage keys from the Python Telegram bot. The front end calls `/api/access/validate` and `/api/admin/access-keys` on this Worker.
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
- POST /api/admin/group-action with chatId, userId and action=ban|unban|mute|unmute — authenticated admin; the bot must have suitable Telegram group permissions.
- POST /telegram/webhook — Telegram webhook secured by TELEGRAM_WEBHOOK_SECRET; currently implements basic bot commands only.

Send Telegram WebApp initData in X-Telegram-Init-Data, never initDataUnsafe. Do not weaken authentication or hardcode a test token.


## Access keys and private-site rollout
- Apply `migrations/0001_admin.sql`, `0002_groups.sql`, `0003_ai_usage.sql`, and `0004_access_keys.sql`.
- Set Worker secrets `BOT_TOKEN`, `OWNER_TELEGRAM_ID=7271410328`, `TELEGRAM_WEBHOOK_SECRET`, and `ACCESS_KEY_BOT_SECRET`. Never commit secrets to Git.
- Set `ADMIN_API_ENDPOINT` in `app.js` to the deployed admin Worker HTTPS URL. Set `GAMEHUB_AI_ENDPOINT` separately to the AI Worker URL ending in `/api/chat`.
- On the Telegram bot host, add `GAMEHUB_ACCESS_API_URL=https://YOUR-ADMIN-WORKER.workers.dev` and `GAMEHUB_ACCESS_BOT_SECRET` (same value as the Worker secret) to `~/.bot.env`. The bot commands `/sitekey`, `/sitekeys`, and `/sitekeyrevoke ID` manage the same D1 keys.
- Access key API: `POST /api/access/validate`; owner-only `GET/POST/DELETE /api/admin/access-keys`; bot-only `POST /api/bot/access-keys`. Keys are stored as SHA-256 hashes; the complete key is shown once.
- Important hosting limitation: GitHub Pages serves static HTML/JS publicly. The gate screens normal use but does not make source files private or prevent direct requests to static assets. For true site-wide access control, move hosting to Cloudflare Pages and place edge middleware/Worker in front of all page and asset requests. Do not describe GitHub Pages alone as private.
