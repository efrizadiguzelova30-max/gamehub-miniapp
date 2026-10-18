import test from "node:test";
import assert from "node:assert/strict";
import worker from "../admin-worker.js";

const origin = "https://efrizadiguzelova30-max.github.io";

test("rejects requests without the exact allowed origin", async () => {
  const response = await worker.fetch(new Request("https://api.example.test/api/site-status"), {});
  assert.equal(response.status, 403);
});

test("answers CORS preflight for the configured site", async () => {
  const response = await worker.fetch(new Request("https://api.example.test/api/admin/status", {
    method: "OPTIONS", headers: { Origin: origin }
  }), {});
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
});

test("public status reports unconfigured backend without exposing secrets", async () => {
  const response = await worker.fetch(new Request("https://api.example.test/api/site-status", {
    headers: { Origin: origin }
  }), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { siteLocked: false, botEnabled: true, configured: false });
});

test("unknown API routes return 404", async () => {
  const response = await worker.fetch(new Request("https://api.example.test/not-a-route", {
    headers: { Origin: origin }
  }), {});
  assert.equal(response.status, 404);
});

test("Telegram webhook requires a configured secret even without browser Origin", async () => {
  const response = await worker.fetch(new Request("https://api.example.test/telegram/webhook", {
    method: "POST", body: JSON.stringify({ update_id: 1 })
  }), {});
  assert.equal(response.status, 503);
});

test("Telegram webhook rejects an invalid secret", async () => {
  const response = await worker.fetch(new Request("https://api.example.test/telegram/webhook", {
    method: "POST",
    headers: { "X-Telegram-Bot-Api-Secret-Token": "wrong-secret", "Content-Type": "application/json" },
    body: JSON.stringify({ update_id: 1 })
  }), { TELEGRAM_WEBHOOK_SECRET: "correct-secret", BOT_TOKEN: "test-token", DB: {} });
  assert.equal(response.status, 403);
});
