const ALLOWED_ORIGIN = "https://efrizadiguzelova30-max.github.io";
const MODEL = "gemini-2.5-flash";
const MAX_MESSAGE_CHARS = 500;
const requestBuckets = new Map(); // Best-effort per-isolate throttle; add platform-level limits for production.

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origin,
      "Vary": "Origin",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) return json({ error: "Origin not allowed." }, 403, ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
      }
    });
    if (request.method !== "POST") return json({ error: "Use POST." }, 405);
    if (!env.GEMINI_API_KEY) return json({ error: "Секрет GEMINI_API_KEY ещё не настроен в Cloudflare." }, 503);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Некорректный JSON." }, 400); }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > MAX_MESSAGE_CHARS) {
      return json({ error: "Сообщение должно содержать от 1 до 500 символов." }, 400);
    }

    const now = Date.now();
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    let bucket = requestBuckets.get(ip);
    if (!bucket || now - bucket.startedAt >= 60000) bucket = { startedAt: now, count: 0 };
    bucket.count += 1;
    requestBuckets.set(ip, bucket);
    if (requestBuckets.size > 1000) {
      for (const [key, value] of requestBuckets) {
        if (now - value.startedAt >= 60000) requestBuckets.delete(key);
      }
    }
    if (bucket.count > 8) return json({ error: "Слишком много сообщений. Подожди минуту и попробуй снова." }, 429);

    try {
      const upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: "Ты GameHub Assistant — дружелюбный помощник по видеоиграм. Отвечай на языке пользователя, обычно по-русски. Помогай с прохождениями, миссиями, игровыми стратегиями, настройками и безопасностью аккаунтов. Не проси пароли, коды подтверждения или платёжные данные. Если не уверен в факте, честно сообщи об этом. Отвечай ясно и по делу." }]
            },
            contents: [{ role: "user", parts: [{ text: message }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 700 }
          })
        }
      );
      const result = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        const status = upstream.status === 429 ? 429 : 502;
        return json({ error: upstream.status === 429
          ? "Бесплатный лимит Gemini временно исчерпан. Попробуй позже."
          : "Gemini временно не ответил. Проверь доступ модели и API-ключ." }, status);
      }
      const reply = (result.candidates || [])
        .flatMap(c => c.content && c.content.parts ? c.content.parts : [])
        .map(p => typeof p.text === "string" ? p.text : "")
        .join("\n").trim();
      if (!reply) return json({ error: "Gemini вернул пустой ответ. Попробуй ещё раз." }, 502);
      return json({ reply });
    } catch {
      return json({ error: "Не удалось связаться с Gemini. Попробуй позже." }, 502);
    }
  }
};
