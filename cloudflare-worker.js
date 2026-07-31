/**
 * AyuVerse — Physics Doubt Solver proxy
 *
 * Deploy this on Cloudflare Workers (free tier). It keeps your
 * Gemini API key secret on the server side and is the only thing
 * your public site is allowed to call (see the site's CSP).
 *
 * SETUP:
 * 1. cloudflare.com → sign up/log in (free) → Workers & Pages → Create → Create Worker
 * 2. Give it a name, e.g. "ayuverse-doubt-solver" → Deploy
 * 3. Click "Edit code" and replace everything with this file → Deploy
 * 4. Settings → Variables and Secrets → Add:
 *      Name: GEMINI_API_KEY   Value: <your AI Studio key>   (type: Secret)
 * 5. Copy the Worker's URL (looks like
 *      https://ayuverse-doubt-solver.<your-subdomain>.workers.dev )
 *    and paste it into:
 *      - WORKER_URL in js/physics-doubt.js
 *      - the connect-src line in physics-doubt.html's CSP meta tag
 * 6. Below, replace ALLOWED_ORIGIN with your real site origin
 *    (no trailing slash, no path) — e.g. "https://maurya-ayush02.github.io"
 */

const ALLOWED_ORIGIN = "https://maurya-ayush02.github.io";
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_MESSAGE_LENGTH = 1500;
const MAX_MESSAGES = 12; // caps conversation length passed per request

function buildSystemPrompt(name) {
  const greeting = name
    ? `The student's name is ${name} — address them by name naturally now and then, not in every message.`
    : "The student hasn't given a name — that's fine, just don't invent one.";

  return `You are "Ayu", the friendly Physics doubt-solving tutor on AyuVerse, a free JEE Advanced prep site.
${greeting}

Rules:
- Only answer physics questions/doubts at a JEE Advanced (Indian competitive exam) level. If the input isn't physics, gently redirect the student back to physics — don't answer unrelated requests.
- Explain like a patient, encouraging teacher, not like a textbook. Plain everyday language, short and clear.
- For numerical problems: name the concept/formula first, show the working, then end with a clearly labelled "Final Answer:" line.
- For conceptual "why" doubts: give the reasoning step by step.
- If the student says they're still confused or asks you to explain again, do NOT just repeat the same explanation in different words — break it into smaller steps, use a simple everyday analogy, and try to spot the specific point that's likely tripping them up.
- Keep responses focused: a few short paragraphs or a short list, not an essay.
- Use plain text only (no markdown symbols like ** or #), since the output is shown as plain text.`;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const name = body && body.name ? String(body.name).trim().slice(0, 30) : "";
    const rawMessages = Array.isArray(body && body.messages) ? body.messages : null;

    if (!rawMessages || rawMessages.length === 0) {
      return json({ error: "No conversation provided" }, 400);
    }
    if (rawMessages.length > MAX_MESSAGES) {
      return json({ error: "Conversation is too long for one request" }, 400);
    }

    const contents = [];
    for (const m of rawMessages) {
      const text = m && m.text ? String(m.text).trim() : "";
      const role = m && m.role === "ai" ? "model" : "user";
      const image = m && m.image && m.image.dataBase64 ? m.image : null;
      if (!text && !image) return json({ error: "Every message must have text" }, 400);
      if (text.length > MAX_MESSAGE_LENGTH) {
        return json({ error: `A message is too long (max ${MAX_MESSAGE_LENGTH} characters)` }, 400);
      }
      const parts = [];
      if (text) parts.push({ text });
      if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.dataBase64 } });
      contents.push({ role, parts });
    }
    if (contents[contents.length - 1].role !== "user") {
      return json({ error: "Conversation must end with the student's message" }, 400);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: "Server misconfigured: missing GEMINI_API_KEY secret" }, 500);
    }

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt(name) }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      }
    ).catch((err) => ({ ok: false, _networkError: err }));

    if (!upstream || upstream._networkError) {
      return json({ error: "Could not reach the AI service. Try again shortly." }, 502);
    }
    if (!upstream.ok) {
      const status = upstream.status;
      if (status === 429) {
        return json({ error: "Free-tier rate limit hit — wait a bit and try again." }, 429);
      }
      const detail = await upstream.text().catch(() => "");
      return json({ error: "Upstream AI error", detail: detail.slice(0, 300) }, 502);
    }

    const data = await upstream.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const answer = parts.map((p) => p.text || "").join("\n").trim();

    if (!answer) {
      return json({ error: "The AI returned an empty response — try rephrasing your question." }, 502);
    }

    return json({ answer });
  },
};
