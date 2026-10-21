# GameHub AI Worker setup

This is the server-side proxy for the Mini App chat. It keeps the Gemini API key out of public JavaScript and applies a D1-backed request limit. It is not deployed automatically by publishing GitHub Pages.

## Deploy
1. Create a Cloudflare Worker named `gamehub-ai` and add `ai-worker.js` as its entry point.
2. Create a Cloudflare D1 database and run `migrations/0003_ai_usage.sql`.
3. Bind that database to the Worker using the binding name `DB`.
4. Add the Gemini key as a Worker secret named `GEMINI_API_KEY` (for example with Wrangler secrets). Never put it in `app.js`, HTML, or Git.
5. Deploy the Worker and copy its HTTPS URL.
6. In `app.js`, replace `PASTE_CLOUDFLARE_WORKER_URL_HERE` with the deployed Worker URL. The frontend appends no path, so the Worker URL should be the base URL and the Worker handles `/api/chat`.
7. Test from the published Mini App. Confirm the chat returns an actual answer and that the sixth request in one minute is rate-limited.

## Safeguards and limits
- Allows requests only from the configured GitHub Pages origin.
- Accepts text only, up to 500 characters.
- Limits each IP hash to 5 requests per 60-second window. The raw IP is not stored in D1.
- Never exposes the API key to the browser.
- Returns generic upstream errors instead of leaking provider responses.
- The rate limit is a basic abuse control, not a substitute for Cloudflare WAF/rate-limiting rules. Requests that omit Cloudflare's IP header share the `unknown` bucket.
