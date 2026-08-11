# CLAUDE.md — ai.maxifidigital.com (maxifi-pages)

Guidance for Claude Code working in this repository. Read `README.md` for the
structure and the cutover runbook; this file carries the facts and rules that
must not be re-derived.

## Facts about the business — do not re-derive these

### THE CANONICAL DESCRIPTOR (copy verbatim; never paraphrase a geography)

> **Maxifi Digital is Singapore-based, serving clients internationally.**

That sentence is the single source of truth for the company's geography in
every artefact this repo produces — landing copy, demo pages, meta
descriptions, schema.org `Organization` blocks, OG tags. Hardwired 2026-07-31
at the operator's instruction.

**Never write, and delete on sight:** "UK-based", "UK/Singapore-based",
"British", GBP/£ pricing implied by a UK location, or any other inferred
geography. **Do not infer a location from an audience, a currency, a spelling
convention, or a domain.** If copy seems to need a different geography,
**ask the operator** — never guess.

Why this is stated so bluntly: an earlier brand-voice source said
"UK/Singapore" and that one wrong string propagated into generated copy
repeatedly before it was caught. Confirmed 2026-07-31: `maxifidigital.com`'s
own page title reads *"MAXIFI DIGITAL | Digital Marketing Agency Singapore"*.

⚠️ A machine-level `CLAUDE.md` on the operator's workstation applies to every
session in every repo and can silently override this file. If you can reach it
and it says UK, fix it at source.

## What this repo is

`ai.maxifidigital.com` — two things on one domain:

1. **The lead-gen landing page** (`index.html`, repo root) — where ads point.
2. **Per-prospect demo pages** — `demos/{slug}.json` → **`/demo/{slug}/`**,
   rendered by `src/demo.njk` (Eleventy). One JSON config per prospect; the
   template carries zero client-specific strings.

## Rules that outrank convenience

- **Never publish a client's or prospect's measured result without written
  permission, and never fabricate one.** `ticker_quotes` must be real
  mini-audit output. A config with no real quotes renders **no ticker** — that
  is the correct behaviour, not a bug to "fill in".
- **Never claim a measurement the engine cannot take.** The five live engines
  are ChatGPT, Claude, Gemini, Perplexity and **Google AI Overviews**.
  **Copilot is not measurable** (no clean real-time API) — do not list it as
  live, and do not promise a date.
- **"Cited" vs "named" are different claims.** Only Perplexity and AI Overviews
  return real source links; the plain-completion LLMs measure what the model
  *says*. Use "named" for those — "cited" would claim a measurement the call
  cannot take.
- **Demo pages are `noindex`** (meta + `X-Robots-Tag` on `/demo/*`). They are
  pitch collateral shared by link. The lead-gen root stays indexable.
- **No spendable secret in the repo.** The demo token is injected at build from
  the `DEMO_PAGE_TOKEN` env var and must stay byte-identical to the engine's
  `DEMO_ACCESS_TOKEN` (Railway project `dazzling-love`, service `web`).
- **`brand_default` empty = no auto-run.** Each auto-run spends real engine
  budget across five engines on every page view. Set it only for an active
  pitch.

## The Findable Candidate (FC) — a separate product

FC is the jobseeker findability product (checklist → candidate file). It is
**not** the AI-visibility agency offer this repo's landing page sells. The
branch `claude/findable-candidate-pages-*` exists here because FC's acquisition
pages were scoped to this domain; the product's own material lives elsewhere.

**Its knowledge base is not in this repo.** The `fc-source-review` skill reads
`knowledge-base.md`, `kb-source-reviews.md` and `kb-changelog.md` "from the
project" — those live in the operator's local FC project. Confirmed absent
2026-08-11 by searching this repo, the whole container filesystem, the Notion
workspace, and all 11 accessible GitHub repos (including a clone of `la-lim`,
which turned out to be the agency marketing site).

**Do not re-derive these:**

- **The five-page acquisition set is blocked.** It needs the three approved
  definition-page names, their target queries, and the KB. None are reachable.
  Per the operator's stop condition: stop, and **do not invent replacement page
  concepts**.
- **Every FC factual statement must trace to the KB at a stated evidence tier.**
  Without the KB every claim is `[EVIDENCE NEEDED]`. That is the blocker — not
  a formatting detail, and not something good copywriting routes around.
- **The S$9.80 pre-order window closed 10 August 2026.** It must not appear on
  any page. Never claim places remain without a verified count.
- **The capture spine is live in n8n, not in this repo.** State, invariants and
  the open beehiiv work: `docs/fc-capture-spine.md`.

## Related repos

- **`limleanne-maxifi/ai-visibility-engine`** — the engine behind `/demo/probe`
  and `/demo/headline`. Its `CLAUDE.md` holds the measurement invariants and
  the §Selling the measurement ordering rule (lead with the loss, not the
  score). Live on Railway; deployment coordinates in its `DEPLOY_RAILWAY.md`.
- **`limleanne-maxifi/asw-hub`** — the Airspace World hub; the origin of this
  repo's demo template. Writes **en-GB** deliberately for a European aviation
  audience — a locale choice for the reader, **not** a claim about where
  Maxifi is.
