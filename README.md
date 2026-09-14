# Tobias Seeanner — personal website

An original responsive portfolio with a charcoal/lime palette, locally hosted Roboto Mono, and subtle terminal-inspired details. Built with Vite, vanilla JavaScript, and Lucide icons. No backend, analytics, or third-party font requests. Buiild by an AI.

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

Deploy the generated `dist/` directory to a static host. For deployment under a subdirectory (for example GitHub Pages at `/website/`), build with `npm run build -- --base=/website/`.

### Deploy to Cloudflare Workers

The `wrangler.jsonc` configuration builds the website and serves `dist/` as static assets. After installing dependencies, authenticate and deploy:

```sh
npx wrangler login
npx wrangler deploy
```

The Worker name is `tobias-seeanner-portfolio`; change `name` in `wrangler.jsonc` if needed. See the [Cloudflare static assets documentation](https://developers.cloudflare.com/workers/static-assets/).

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
- Profile placeholder: `public/profile-placeholder.svg`. Replace the image and update the `src`, `alt`, and placeholder labels in `index.html`.
- Thesis: the paper section is intentionally a placeholder. Add the actual title, abstract, and a public PDF when ready; no nonexistent download is offered.
- Source notes: `CONTENT_SOURCES.md`.

The original CV is retained in the repository, outside `public/`, and is not copied into the production build. Public copy includes professional background and the contact email, omitting the CV’s street address, phone number, and birth date.
