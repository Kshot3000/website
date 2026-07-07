# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is the marketing landing page for **OctaSpace** (a decentralized GPU cloud / compute platform), built on top of the "Launch UI" Next.js template (see `package.json` name `launch-ui` and `components/logos/launch-ui.tsx`). It is a static site: Next.js App Router with `output: 'export'` in `next.config.mjs`, deployed as static HTML/JS (see `.github/workflows/gh-pages.yml`, which builds and publishes `./out` to GitHub Pages on tag push `v*`).

## Commands

```bash
npm run dev      # next dev --turbopack
npm run build    # next build (static export to ./out); postbuild runs next-sitemap
npm run start    # next start (only useful for local export preview; not used in prod)
npm run lint     # next lint
```

There is no test suite configured in this repo.

Node/GPU imagery/video assets live in `public/img/` (mp4s, screenshots) and are referenced directly with absolute `/img/...` paths — no image optimization is available since `images.unoptimized: true` (required for static export).

## Architecture

### Template structure: variant components, not single-purpose components

`components/sections/*` is organized by **section category** (e.g. `hero/`, `feature/`, `bento-grid/`, `pricing/`, `navbar/`, `footer/`, `faq/`, `cta/`, `tabs/`, `stats/`), and each category contains multiple **interchangeable visual variants** (`default.tsx`, `barebone.tsx`, `sticky-left.tsx`, `sticky-right desktop.tsx`, `illustration-bottom.tsx`, etc.). `app/page.tsx` composes the page by importing a specific variant from each category — e.g. `Hero` is `components/sections/hero/layers`, `BentoGrid` is `components/sections/bento-grid/3-rows-top`. When asked to change a section's look, check whether an existing sibling variant already does what's wanted before writing new markup.

`components/ui/*` holds the shared primitives these sections are built from (`Mockup`/`MockupFrame`, `Screenshot`, `Section`, `Navbar`, `Marquee`, `PricingColumn`, etc.), plus shadcn/ui-style primitives (`button`, `dialog`-adjacent, `tabs`, `select`, ...). `components.json` configures shadcn (`style: new-york`, base color `zinc`, no class prefix); use `npx shadcn` conventions if adding new primitives.

`components/illustrations/*` and `components/logos/*` are decorative SVG/visual components (illustrations used inside feature/bento sections; logos used in navbar/footer/logo-cloud sections).

Some files under `components/sections/pricing/` and `components/ui/` have a `.bak` extension (e.g. `sidebar.tsx.bak`, `pricing/2-cols-subscription.tsx.bak`) and are explicitly force-included in `tsconfig.json`'s `include` array — these are retained-but-unused template variants, not dead files to delete casually.

### Live network data flow

`lib/octa-network.ts` fetches live stats from `https://api.octa.computer/network` (5s timeout, falls back to `fallbackOctaNetworkSnapshot` on any error) and normalizes them into `OctaNetworkSnapshot` (GPU counts, node counts, TFLOPS, live per-GPU pricing plans). `app/page.tsx` fetches this server-side once (`getOctaNetworkSnapshot()` in the async page component) and passes it as `initialSnapshot` into `NetworkSnapshotProvider` (`components/sections/network-snapshot.tsx`), a client component that re-fetches on mount and exposes the snapshot via context to `NetworkStatsGridBoxed`, `NetworkStatsStrip`, and `NetworkPricing`. Note: `output: 'export'` means this server-side fetch happens only at build time, not per-request — the client-side re-fetch in the provider's `useEffect` is what keeps numbers live after deploy.

### Theming via CSS custom properties, not Tailwind config

Brand colors are defined as OKLCH custom properties per "brand" (ember, fire, ultraviolet, ice, titanium, emerald, holo, electro, octa) in `styles/theme.css`, with light values under `:root` and dark overrides under `.dark`. The root layout forces dark mode unconditionally (`<html class="dark" style={{ colorScheme: "dark" }}>` in `app/layout.tsx`) — there is no runtime light/dark toggle even though `next-themes` and `mode-toggle.tsx` exist in the codebase.

Pages/sections opt into a brand palette by overriding the semantic variables (`--brand`, `--brand-foreground`, `--background`, `--primary`, `--muted`, `--radius`) inline via `style` with `light-dark()` on the wrapping element — see the `style` block in `app/page.tsx`'s root `<div>`, which maps the page to the `octa` brand (`--background-octa`, `--brand-octa`, etc). To reskin a page to a different brand, change that mapping rather than editing Tailwind classes throughout.

`app/globals.css` is the entry point importing `styles/utils.css`, `styles/pro.css`, `styles/theme.css`, `styles/terminal.css`, and `tw-animate-css`, then defines the Tailwind v4 `@theme inline` block that wires semantic CSS vars (`--color-*`, `--radius-*`, `--spacing-container*`) into Tailwind utilities. There is no `tailwind.config.ts`/`.js` — Tailwind v4 is configured entirely through CSS (`@theme` + `@custom-variant dark`).

### SEO

`config/site.ts` holds shared site metadata (name, url, description, social links) consumed by `app/layout.tsx` for the root `Metadata` (OpenGraph/Twitter/JSON-LD for `Organization` and `WebSite`) and per-page metadata overrides (e.g. `app/page.tsx`, `app/privacy/page.tsx`). `next-sitemap.config.js` generates `sitemap.xml`/`robots.txt` into `./out` as a `postbuild` step; keep its `exclude` list (currently `/api/*`, `/admin/*`, `/vpn`) in sync with real routes under `app/`.

### Lint config duplication

Both a legacy `.eslintrc.json` (used by `next lint`) and a flat `eslint.config.js` exist with overlapping rules (`unused-imports`, `simple-import-sort`). Keep both in sync if changing lint rules, or check which one is actually active before assuming a rule change took effect.
