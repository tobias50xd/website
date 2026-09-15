const form = document.querySelector("#contact-form");
const button = form.querySelector('button[type="submit"]');
const status = document.querySelector("#contact-status");
let token = "";
let widget;
let sending = false;
let attempted = false;

function invalidate(message) {
  token = "";
  button.disabled = true;
  status.textContent = message;
}

async function initialize() {
  try {
    const response = await fetch("/api/contact/config");
    if (!response.ok) throw new Error();
    const { siteKey } = await response.json();
    if (!siteKey) throw new Error();
    await new Promise((resolve, reject) => {
      window.onContactTurnstileLoad = resolve;
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onContactTurnstileLoad&render=explicit";
      script.async = true;
      script.onerror = reject;
      const timeout = setTimeout(reject, 15000);
      window.onContactTurnstileLoad = () => {
        clearTimeout(timeout);
        resolve();
      };
      document.head.append(script);
    });
    widget = window.turnstile.render("#contact-turnstile", {
      sitekey: siteKey,
      action: "contact",
      theme: "dark",
      size: "compact",
      callback(value) {
        token = value;
        button.disabled = sending;
        if (!sending && !attempted) status.textContent = "Ready to send.";
      },
      "expired-callback"() {
        invalidate("Verification expired. Please verify again.");
      },
      "error-callback"() {
        invalidate("Verification couldn’t load. Please reload the page to try again.");
      },
      "timeout-callback"() {
        invalidate("Verification timed out. Please try the check again.");
      },
    });
  } catch {
    invalidate("The contact form is temporarily unavailable. Please try again later or reach out on LinkedIn.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sending || !token || !form.reportValidity()) return;
  sending = true;
  attempted = true;
  button.disabled = true;
  form.setAttribute("aria-busy", "true");
  status.textContent = "Sending your message…";
  const fields = new FormData(form);
  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fields.get("name"),
        email: fields.get("email"),
        message: fields.get("message"),
        token,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Your message couldn’t be sent. Please try again.");
    }
    form.reset();
    status.textContent = "Thanks! Your message has been sent.";
  } catch (error) {
    status.textContent = error.name === "TimeoutError" || error instanceof TypeError
      ? "Couldn’t confirm delivery. Please check your connection before trying again."
      : error.message;
  } finally {
    sending = false;
    token = "";
    form.removeAttribute("aria-busy");
    if (widget !== undefined) window.turnstile.reset(widget);
  }
});

initialize();
