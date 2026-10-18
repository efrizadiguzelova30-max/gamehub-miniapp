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
