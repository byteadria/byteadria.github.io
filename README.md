# GitByte — Backend Engineering Practice

Founder-led backend engineering practice specializing in PHP, Symfony, and Laravel — authentication hardening, database optimization, legacy modernization, and production support for SaaS founders and CTOs.

This repository is the **public marketing site**: a single-page Astro site published at <https://byteadria.github.io>.

## Tech Stack

- **Astro 5** — static site generation with `@astrojs/sitemap`
- **Tailwind CSS 3** — utility-first styling via `@astrojs/tailwind`
- **Self-hosted variable fonts** — Inter + Space Grotesk via `@fontsource-variable`; no external font requests
- **SEO ready** — Open Graph / Twitter meta, canonical URLs, JSON-LD structured data, `robots.txt`, auto-generated sitemap
- **Playwright** — end-to-end tests against the real dev server

## Quick Start

Requires [Node.js](https://nodejs.org) 20+ (CI builds with Node 22).

From the repository root, run:

```powershell
.\start.ps1
```

`start.ps1` handles the entire local environment:

1. Verifies Node.js / npm are installed.
2. Checks that `node_modules` exists and is in sync with `package-lock.json`; runs `npm install` only when needed.
3. Checks that port `4321` is free. If the Astro dev server is already running, it reports that and stops; if another process occupies the port, it tells you which one and refuses to touch it.
4. Starts `npm run dev` — the Astro dev server (`astro dev`) — and waits until the site actually responds.
5. Stays attached so logs are visible. Press **Ctrl+C** to stop; the dev server is shut down too (no orphaned processes).

Then open **http://localhost:4321**.

### Manual (equivalent)

```powershell
npm install      # only if node_modules is missing
npm run dev      # Astro dev server on http://localhost:4321
```

## Testing

```powershell
npm test          # Playwright end-to-end suite
npm run test:ui   # Playwright with the interactive UI
```

`playwright.config.ts` targets `http://localhost:4321` and auto-starts (`npm run dev`) or reuses an already-running dev server.

## Build & Preview

```powershell
npm run build      # static output -> dist/
npm run preview    # serve the built site locally
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`: `npm ci` → `astro build` → publish to **GitHub Pages** at <https://byteadria.github.io>.

## Project Structure

```
├── .github/workflows/deploy.yml   # CI/CD -> GitHub Pages
├── public/                         # static assets (favicon.svg, robots.txt)
├── src/
│   ├── components/                 # Navbar, Hero, Services, CaseStudies, WhyUs, CTA, Footer, ...
│   ├── layouts/Layout.astro        # global head, SEO meta, fonts, theme handling
│   ├── pages/index.astro           # the single landing page
│   └── styles/                     # fonts.css, global.css
├── tests/                          # Playwright e2e specs
├── astro.config.mjs
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tailwind.config.mjs
└── tsconfig.json
```

## Environment

No environment variables or `.env` files are required — the site is fully static.

## License

MIT