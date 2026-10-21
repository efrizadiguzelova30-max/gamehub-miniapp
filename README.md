# GameHub — Telegram Mini App

GameHub is a Russian-language gaming hub with a game catalogue, tips, daily demo quests, public Roblox username-to-ID lookup, safe public-data tools, and an AI chat interface.

## Project structure
- `index.html`, `style.css`, `app.js` — static Mini App frontend published via GitHub Pages.
- `admin-worker.js` — Cloudflare Worker starter for server-verified Telegram Mini App authorization, owner/admin roles, managed groups and the Telegram webhook.
- `ai-worker.js` — Cloudflare Worker proxy for Gemini-powered gaming help. The provider key stays server-side.
- `migrations/` — Cloudflare D1 SQL migrations for admin settings, managed groups and AI rate-limit counters.
- `BACKEND_SETUP.md` — admin/webhook deployment guide.
- `AI_WORKER_SETUP.md` — AI chat deployment guide.

## Current implementation status
The frontend and Worker source are in this repository, but adding code to GitHub does not deploy/configure Cloudflare Workers automatically. The AI chat and admin panel remain unavailable until the Worker URLs, D1 bindings, secrets and Telegram webhook are configured and tested. Do not describe the full backend as live before that verification.

## Important owner setup note
The Telegram username `mogila_deda100` is not a numeric Telegram user ID. The admin Worker requires the numeric ID in `OWNER_TELEGRAM_ID`, as well as the bot token stored as a Worker secret. Never commit tokens, passwords, or API keys to this repository.

## Safety
The public lookup features are intended for public information and authorized checks only. The project must not be used to obtain private personal records, passwords, recovery codes or unauthorized account access.
