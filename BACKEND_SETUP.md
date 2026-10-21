# LUNIUM access-key backend

This repository contains the frontend and a Cloudflare Worker implementation. **Access keys are not live until the Worker is deployed, D1 migrations are applied, and the Worker URL is set in `app.js`.** GitHub Pages alone cannot securely keep HTML/JS private.

## What is implemented

- `admin-worker.js`: Telegram Mini App HMAC verification, owner-only administration, access-key create/list/reset endpoints, public key validation, a webhook command path, and a shared-secret API for an existing polling bot.
- `migrations/0003_access_keys.sql`: stores only SHA-256 hashes of keys, expiry, revocation, and use metadata.
- The browser gate accepts keys only through `POST /api/access/validate` once `ADMIN_API_ENDPOINT` is configured in `app.js`.
- Owner panel endpoints: `GET/POST /api/admin/keys`, `POST /api/admin/keys/reset`.
- Existing polling bot integration endpoints: `POST /api/bot/generate-key` and `POST /api/bot/reset-keys`, protected by `X-Bot-Command-Secret`.
- Worker webhook commands (if the bot is switched to webhook mode): `/key [hours]`, `/keys`, `/resetkeys`, owner-only and private-chat-only.

## Required setup before keys can work

1. Create a Cloudflare D1 database and a Worker named `gamehub-admin-api`. Use `wrangler.toml.example` as a template, replacing the D1 database ID.
2. Apply migrations in order, including `migrations/0003_access_keys.sql`, using `npx wrangler d1 migrations apply gamehub-admin --remote`.
3. Set Worker secrets:
   - `BOT_TOKEN`: token of the Telegram bot that owns the site.
   - The owner ID `7271410328` is built into `admin-worker.js`; `OWNER_TELEGRAM_ID` is optional if you want to override it.
   - `TELEGRAM_WEBHOOK_SECRET`: random secret only if using Telegram webhook mode.
   - `BOT_COMMAND_SECRET`: a separate random secret used by the existing polling bot to call the key API.
4. Deploy the Worker with `npx wrangler deploy` and copy its real `https://…workers.dev` URL.
5. In `app.js`, replace `PASTE_CLOUDFLARE_ADMIN_WORKER_URL_HERE` with that exact Worker URL. Commit and publish the frontend after that.
6. For an existing polling bot, add commands that call the Worker endpoints below. Do **not** register a Telegram webhook while another process is using `getUpdates`; Telegram polling and webhook modes conflict.
7. If using webhook mode instead, stop the polling process first, then register the Worker URL ending in `/telegram/webhook` and use the same `TELEGRAM_WEBHOOK_SECRET` in Telegram's `secret_token` setting.

## Existing polling bot API

Request:
- `POST /api/bot/generate-key`
- Header: `X-Bot-Command-Secret: <BOT_COMMAND_SECRET>`
- JSON body: `{"hours":24}` (1–720 hours; optional, defaults to 24)

The response contains the plaintext key exactly once, plus creation and expiry timestamps. The bot must check that the sender's Telegram ID equals `OWNER_TELEGRAM_ID` **before** calling this endpoint, and should only deliver the key in a private chat with the owner.

To revoke every active key:
- `POST /api/bot/reset-keys`
- Same secret header.
- Bot should restrict this command to the owner in private chat.

Never expose `BOT_COMMAND_SECRET`, `BOT_TOKEN`, or the Worker URL's secret values in public HTML, JavaScript, chat logs, or a public repository.

## Admin API

- `GET /api/site-status` — public status flags.
- `GET /api/admin/status` — authenticated actor and flags; requires Telegram WebApp `initData` in `X-Telegram-Init-Data`.
- `POST /api/admin/site-lock` with `{"locked":true|false}` — owner only.
- `POST /api/admin/bot` with `{"enabled":true|false}` — owner only.
- `GET /api/admin/keys` — owner-only key inventory (key values are not stored or returned).
- `POST /api/admin/keys` with `{"hours":24}` — owner-only generation; plaintext is returned once.
- `POST /api/admin/keys/reset` with `{}` — owner-only revoke-all.
- `POST /api/access/validate` with `{"key":"LUN-…"}` — public validation, rate limits should be configured at Cloudflare edge before a public launch.
- `GET/POST/DELETE /api/admin/admins` — owner-only role management.
- `GET/POST/DELETE /api/admin/groups` and `POST /api/admin/group-action` — group moderation routes.
- `POST /telegram/webhook` — webhook mode only.

## Important limitation

GitHub Pages serves static source files publicly. The key gate controls normal site use but cannot make the underlying HTML/JavaScript secret. Any truly private data or actions must stay behind authenticated Worker endpoints. A key-gated UI must never be treated as a substitute for backend authorization.
