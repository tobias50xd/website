const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});
const unavailable = () => json({ error: "The contact form is temporarily unavailable. Please try again later." }, 503);
const ready = (env) => env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.CONTACT_FROM && env.CONTACT_TO && env.CONTACT_EMAIL;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact/config" && request.method === "GET") {
      return ready(env) ? json({ siteKey: env.TURNSTILE_SITE_KEY }) : unavailable();
    }
    if (url.pathname !== "/api/contact") {
      if (url.pathname.startsWith("/api/")) return json({ error: "Not found." }, 404);
      return env.ASSETS.fetch(request);
    }
    if (request.method !== "POST") return json({ error: "Use POST." }, 405);
    if (request.headers.get("Origin") !== url.origin) return json({ error: "Invalid origin." }, 403);
    if (request.headers.get("Content-Type")?.split(";")[0].trim() !== "application/json") {
      return json({ error: "Expected JSON." }, 415);
    }
    if (!ready(env)) return unavailable();

    // Bound the streamed body too: Content-Length is optional and untrusted.
    let data;
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({ error: "Missing message." }, 400);
      const chunks = [];
      let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 32768) {
          await reader.cancel();
          return json({ error: "Message is too large." }, 413);
        }
        chunks.push(value);
      }
      data = JSON.parse(await new Blob(chunks).text());
    } catch {
      return json({ error: "Invalid message." }, 400);
    }
    const { name, email, message, token } = data || {};
    if (typeof name !== "string" || !name.trim() || name.length > 100 || /[\r\n]/.test(name) ||
        typeof email !== "string" || email.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) ||
        typeof message !== "string" || !message.trim() || message.length > 5000 ||
        typeof token !== "string" || !token || token.length > 2048) {
      return json({ error: "Please check your name, email, message, and verification." }, 400);
    }
    try {
      const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: request.headers.get("CF-Connecting-IP") || undefined,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!verification.ok) return unavailable();
      const result = await verification.json();
      if (!result.success || result.action !== "contact" || result.hostname !== url.hostname) {
        return json({ error: "Verification failed or expired. Please verify again." }, 400);
      }
      await env.CONTACT_EMAIL.send({
        from: env.CONTACT_FROM,
        to: env.CONTACT_TO,
        replyTo: email,
        subject: "New website contact message",
        text: `Name: ${name.trim()}\nEmail: ${email}\n\n${message.trim()}`,
      });
      return json({ success: true });
    } catch {
      return unavailable();
    }
  },
};
