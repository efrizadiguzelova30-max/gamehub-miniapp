const ALLOWED_ORIGIN = "https://efrizadiguzelova30-max.github.io";
const MAX_MESSAGE_CHARS = 500;
const RATE_LIMIT = 5;
const WINDOW_SECONDS = 60;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff"
  }});
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeRateLimit(db, ip) {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / WINDOW_SECONDS);
  const ipHash = await sha256(ip || "unknown");
  await db.prepare(
    "INSERT INTO ai_usage (ip_hash, window_start, request_count) VALUES (?, ?, 1) " +
    "ON CONFLICT(ip_hash, window_start) DO UPDATE SET request_count = request_count + 1"
  ).bind(ipHash, bucket).run();
  const row = await db.prepare(
    "SELECT request_count FROM ai_usage WHERE ip_hash = ? AND window_start = ?"
  ).bind(ipHash, bucket).first();
  if (bucket % 10 === 0) {
    await db.prepare("DELETE FROM ai_usage WHERE window_start < ?").bind(bucket - 1440).run();
  }
  return Number(row?.request_count || 0) <= RATE_LIMIT;
}

async function handleChat(request, env) {
  if (request.headers.get("Origin") !== ALLOWED_ORIGIN) return json({ error: "Origin not allowed." }, 403);
  if (!env.GEMINI_API_KEY) return json({ error: "ИИ-сервис ещё не настроен владельцем." }, 503);
  if (!env.DB) return json({ error: "База лимитов ИИ ещё не настроена." }, 503);

  let body;
  try {
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 4000) return json({ error: "Сообщение слишком большое." }, 413);
    body = await request.json();
  } catch {
    return json({ error: "Некорректный JSON." }, 400);
  }
  if (!body || typeof body.message !== "string") return json({ error: "Напиши вопрос текстом." }, 400);
  const message = body.message.trim();
  if (!message || message.length > MAX_MESSAGE_CHARS) {
    return json({ error: "Сообщение должно содержать от 1 до 500 символов." }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    if (!(await consumeRateLimit(env.DB, ip))) {
      return json({ error: "Лимит — 5 сообщений в минуту с одного IP. Попробуй позже." }, 429);
    }
  } catch {
    return json({ error: "Не удалось проверить лимит запросов. Попробуй позже." }, 503);
  }

  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(env.GEMINI_API_KEY);
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text:
          "Ты — GameHub, русскоязычный помощник по видеоиграм и цифровой грамотности. " +
          "Отвечай полезно, ясно и по существу. Для вопросов о прохождениях, тактиках, настройках и игровых событиях давай пошаговые советы. " +
          "Не утверждай, что проверил актуальные события, если у тебя нет подтверждённых данных. " +
          "Не помогай красть аккаунты, обходить защиту, создавать вредоносное ПО, добывать закрытые персональные данные или нарушать правила игр. " +
          "Не проси пароли, коды подтверждения, токены и API-ключи. Если вопрос не связан с играми, кратко помоги в рамках безопасной цифровой грамотности."
        }]},
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 700 }
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      if (upstream.status === 429) return json({ error: "ИИ временно перегружен. Попробуй немного позже." }, 429);
      return json({ error: "ИИ временно недоступен. Попробуй позже." }, 502);
    }
    const reply = (data.candidates?.[0]?.content?.parts || [])
      .map(part => typeof part.text === "string" ? part.text : "")
      .join("\n").trim();
    if (!reply) return json({ error: "ИИ не вернул текст ответа." }, 502);
    return json({ reply });
  } catch {
    return json({ error: "Не удалось связаться с ИИ. Попробуй позже." }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      if (request.headers.get("Origin") !== ALLOWED_ORIGIN) return json({ error: "Origin not allowed." }, 403);
      return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
      }});
    }
    if (url.pathname !== "/api/chat") return json({ error: "Not found." }, 404);
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    return handleChat(request, env);
  }
};
