# Tobias Seeanner — personal website

An original responsive portfolio with a charcoal/lime palette, locally hosted Roboto Mono, and subtle terminal-inspired details. Built with Vite, vanilla JavaScript, and Lucide icons. A Cloudflare Worker handles contact submissions with Turnstile verification and email delivery. No analytics or third-party font requests. Built by an AI.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

## Build and preview

```sh
npm run build
npm run preview
```

The generated `dist/` directory contains the frontend; the contact form also requires the Cloudflare Worker. For deployment under a subdirectory (for example GitHub Pages at `/website/`), build with `npm run build -- --base=/website/`.

### Deploy to Cloudflare Workers

The `wrangler.jsonc` configuration builds the website, serves static assets, and routes `/api/*` through `worker/index.js`. Complete the contact setup below before deploying:

```sh
npx wrangler login
npx wrangler deploy
```

The Worker name is `tobias-seeanner-portfolio`; change `name` in `wrangler.jsonc` if needed. See the [Cloudflare static assets documentation](https://developers.cloudflare.com/workers/static-assets/).

## Contact form setup

The form collects name, reply email, and message. The Worker validates input and checks the Turnstile token, hostname, and `contact` action before sending to the fixed inbox. Missing configuration disables submissions. The browser only receives the public site key; the secret stays in the Worker.

1. In the Cloudflare dashboard, create a **Turnstile** widget using **Managed** mode. Add every hostname where the form will run (your domain and the Worker hostname if used). Copy the site key and secret key. See [Turnstile setup](https://developers.cloudflare.com/turnstile/get-started/).
2. Configure your domain for Cloudflare Email Service / Email Routing and verify `tobias.seeanner@gmail.com` as a destination address using Cloudflare’s verification email. Choose a sender on that domain, such as `website@your-domain.com`. See [domain configuration](https://developers.cloudflare.com/email-service/configuration/domain-configuration/) and [destination addresses](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/). The sender must belong to your configured domain; use the visitor’s address only as Reply-To.
3. Add `TURNSTILE_SITE_KEY` and `CONTACT_FROM` to `vars` in `wrangler.jsonc`, using your real values. `CONTACT_TO` and the `CONTACT_EMAIL` binding already target the existing Gmail inbox. If changing the destination, update both and verify the new address.
4. Store the secret with `npx wrangler secret put TURNSTILE_SECRET_KEY` and enter it when prompted. Never put it in frontend code, a `VITE_` variable, or version control.
5. Deploy with `npx wrangler deploy`. Submit a real message and confirm arrival in your inbox. Replies go to the visitor’s email.

For full local development, build and run `npx wrangler dev`. Put the same variable names in an ignored `.dev.vars` file. Use a real widget allowing `localhost` for end-to-end verification; this Worker intentionally checks the hostname and action. Local email delivery is simulated by Wrangler unless explicitly configured otherwise. `npm run dev` previews the frontend only, so the form shows an unavailable message there. Automated tests mock Turnstile and email delivery and never send email.

Implementation references: [server-side Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) and [Cloudflare email binding API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/).

## Checks

```sh
npx playwright install chromium
npm test
```

Browser checks cover layouts at 320, 390, 768, and 1440 pixels, WCAG A/AA automated accessibility checks, image loading, project filtering, modal keyboard dismissal/focus restoration, and mobile navigation.

## Editing

- Page copy and section structure: `index.html`.
- Project detail content and interactions: `src/main.js`.
- Theme, spacing, and breakpoints: `src/style.css`.
- Profile photo: `static/tobi_cut.jpg`, referenced in `index.html` and bundled by Vite. Adjust its framing with `.portrait img` in `src/style.css`.
- Thesis: the paper section is intentionally a placeholder. Add the actual title, abstract, and a public PDF when ready; no nonexistent download is offered.
- Source notes: `CONTENT_SOURCES.md`.

The original CV is retained in the repository, outside `public/`, and is not copied into the production build. Public page copy includes professional background and a contact form, omitting the CV’s street address, phone number, and birth date.
