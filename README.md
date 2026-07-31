# ai.maxifidigital.com — landing page + per-prospect demo pages

Two things live here, one domain:

1. **The lead-gen landing page** (`index.html` at the repo root) — the page
   ads point at. Served today by **GitHub Pages** (CNAME `ai.maxifidigital.com`).
2. **Per-prospect AI-visibility demo pages** — `demos/{slug}.json` →
   **`/demo-{slug}/`**, rendered by `src/demo.njk` (Eleventy). These need
   **Netlify** (probe proxy + Forms email gate) and only go live after the
   cutover below.

## The rule (de facto, going forward)

> **Every per-prospect demo page is a subpage of ai.maxifidigital.com at
> `/demo-<company>` — one JSON config in `demos/`, zero code, zero
> client-specific strings in the template.**

- Adding a prospect = adding `demos/{slug}.json` (copy `b2b.json`; schema in
  `demos/README.md`). The page appears at `/demo-{slug}/` on the next build.
- Demo pages are **noindex** (meta + `X-Robots-Tag`) — they are pitch
  collateral shared by link, never search-landing pages. The lead-gen root
  stays indexable.
- `ticker_quotes` must be **real mini-audit output** — never invented
  (engine invariant 9: no fabricated results; no prospect's measured result
  published without written permission — get that permission before merging a
  config whose ticker shows the prospect's own losses).
- `brand_default` empty = no auto-run on page load (each auto-run spends
  real engine budget across 5 engines). Set it only for an active pitch.
- The live tester calls `/demo/probe` **same-origin**; Netlify proxies it to
  the engine on Railway (`netlify.toml`). No API keys in the client; the
  demo token is injected at build from the `DEMO_PAGE_TOKEN` env var and is
  budget-capped + rotatable on the engine side (`DEMO_ACCESS_TOKEN`).

Current configs: `canso` (Airspace World — migrated from asw-hub),
`ortus` (The Ortus Club — migrated from asw-hub), `nsas` (new; no ticker —
no stored mini-audit quotes exist, and none were invented; auto-run off),
`b2b` (the copyable template).

## Cutover runbook (operator; ~30 min; demo pages are dark until done)

1. **Netlify**: New site from this repo. Build auto-detects `netlify.toml`.
   Set env var `DEMO_PAGE_TOKEN` = the engine's `DEMO_ACCESS_TOKEN` value.
2. **Verify on the `*.netlify.app` URL**: `/` (landing), `/demo-canso/`,
   `/demo-ortus/`, `/demo-nsas/`, `/demo-b2b/`; run a live probe on one page
   (checks the Railway proxy + token); submit the email gate (checks Forms —
   enable form detection in Site settings if submissions don't appear).
3. **DNS**: point the `ai` CNAME at the Netlify site (replacing
   `limleanne-maxifi.github.io`). Add the custom domain in Netlify first so
   TLS provisions.
4. **GitHub Pages**: unpublish (Settings → Pages) once DNS has propagated.
   The `CNAME` file can then be deleted from the repo.
5. **asw-hub**: add 301s from `aswhub.maxifidigital.com/demo/canso/` and
   `/demo/ortus/` to `https://ai.maxifidigital.com/demo-canso/` /
   `/demo-ortus/` (and retire its `/CANSO-demo/` page the same way), and
   remove its `demos/` configs so the pages stop building there. **Do this
   only after step 3** — the redirect targets must exist first.
6. **asw-hub probe proxy**: while in there, fix its `/demo/probe` proxy —
   it still points at `ai-visibility-engine.onrender.com`; the engine's live
   host is Railway (`web-production-00ba0.up.railway.app`). If the Render
   service is dead, the asw-hub demo testers are silently broken today.
7. **Rotate the demo token** (engine `DEMO_ACCESS_TOKEN` + Netlify
   `DEMO_PAGE_TOKEN`): the old value `aw2026-demo-k9td` is hardcoded in the
   public asw-hub repo/pages, so treat it as burned once those pages retire.

Merging this branch **before** the cutover is safe: GitHub Pages serves the
repo root, `index.html` is untouched, and the new source files are inert
there (they'd be fetchable as raw files, which is fine — the repo is public).

## Local dev

```bash
npm install
npm start          # http://localhost:8080 — landing at /, demos at /demo-{slug}/
```

Live-tester probes need the Netlify proxy (or point `PROBE_URL` at the
Railway host directly in dev); the email gate needs Netlify Forms — neither
works on plain GitHub Pages, which is exactly why the demo pages wait for
the cutover.
