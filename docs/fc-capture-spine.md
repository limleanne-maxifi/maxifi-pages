# FC capture spine — state, invariants, and the open beehiiv work

The Findable Candidate's capture spine lives in **n8n** (`lloop.app.n8n.cloud`),
not in this repo. This file is the written record so it does not have to be
re-derived from the n8n canvas every time.

> **This repo is public.** No spreadsheet IDs, publication IDs, webhook URLs or
> credential IDs are recorded here — they are identifiers that would let a
> stranger post into the lead sheet or address the beehiiv account. Every one of
> them is visible in the n8n workflow that uses it, which is the only place they
> need to exist. Keep it that way.

Last verified: **2026-08-11**.

---

## What is running

Five active workflows, all writing to one Google spreadsheet with three tabs —
`Leads`, `File Queue`, `Errors`.

| Workflow | Trigger | What it does |
| --- | --- | --- |
| **WF-A · Checklist capture** | `POST` webhook from `findability-checklist.html` | Validate → dedupe → beehiiv upsert → enrol in welcome automation → append `Leads` |
| **WF-B · File order** | Stripe payment link **and** `candidate-file-intake.html` | Match payment to intake by email → append `File Queue` with archetype columns, `status=queued` → notify by email with the archetype's batch count |
| **WF-C · Batch trigger** | Daily 09:00 Asia/Singapore | Group `File Queue` by archetype; if ≥5 queued **or** oldest >7 days, email the batch sheet and mark those rows `batched` |
| **WF-E · Error sink** | Error trigger | Set as `errorWorkflow` on WF-A and WF-C — catches unhandled failures |
| **WF-H · Errors watch** | Hourly | Emails when new `Errors` rows appear at severity `reject` or `blocking`. Added 2026-08-11 because nothing had ever *read* the Errors sheet |

### Invariants — these are load-bearing

- **Idempotent on duplicate webhooks.** WF-A dedupes on `email|submittedAt`.
  `submittedAt` must be generated **once per submission by the form** and reused
  on client-side retries. A form that regenerates it on retry defeats the key
  and creates duplicate leads.
- **Every failure path writes to `Errors`.** Silent drops are the failure mode
  this spine is built to prevent. Severity is graded: `reject` (payload refused)
  and `blocking` (notification failed) page via WF-H; `degraded` (a downstream
  service misbehaved but the lead was still captured) is recorded without
  paging.
- **A lead is never lost to a downstream outage.** If beehiiv is down or refuses
  enrolment, the `Leads` row is still written, flagged with what happened.
- **WF-C only consumes a batch after the email actually sends.** On send failure
  the rows stay `queued` and tomorrow's run retries. Queued rows with no
  `batch_key` are surfaced loudly rather than silently skipped.
- **Do not touch JobLoop (WF1–WF5) or the RRL workflows.** Separate systems on
  the same n8n instance.
- **No LinkedIn API or scraping anywhere in this spine.**

---

## beehiiv — verified state as of 2026-08-11

Probed read-only through n8n's stored credential, so the API key never left the
instance.

**Custom fields — all five exist and are correctly typed:**

| Field | Type | Source in the checklist payload |
| --- | --- | --- |
| `function` | string | `tool` — **see open question below** |
| `seniority` | string | `seniority` |
| `search_stage` | string | `stage` |
| `score` | **integer** | `score` |
| `band` | string | `band` |

WF-A sends `score` as a Number, which matches the integer field — it sorts and
segments numerically in beehiiv rather than lexically. Don't "fix" it to a
string.

**Automations — exactly one, and it is not usable yet:**

- Name: `New Automation` (the beehiiv default — never renamed)
- Status: **`draft`**
- Trigger events: **none**
- Content: none

That is the entire remaining gap in the spine.

---

## What WF-A does about it now

Enrolment is wired and waiting. The graph after the beehiiv upsert:

```
beehiiv · upsert subscriber ──▶ beehiiv · enrol in welcome automation ──▶ Enrolment ok?
                                                                          ├─ yes ─▶ Compose Leads row
                                                                          └─ no ──▶ Errors · automation ─▶ Compose Leads row
```

Design decisions worth not re-litigating:

- **Enrolment is an explicit call after the upsert**, not an `automation_ids`
  field on the subscription create. The create only enrols brand-new
  subscribers, and WF-A re-sends existing ones with `reactivate_existing` — so
  the field would silently skip every returning subscriber.
- **The automation ID has one home**: the `AUTOMATION_ID` constant in WF-A's
  `Prepare beehiiv payload` node. The enrol node reads it from there. To pause
  enrolment, disable the enrol node — don't blank the constant.
- **The enrol node runs with `fullResponse` + `neverError`**, so a 4xx arrives as
  data carrying a status code instead of throwing. No retry storm against a
  deterministic rejection.
- **`automation_enrolled` on the `Leads` row is measured, not assumed.** It was
  previously the hardcoded string `not configured`. It now records one of:
  `enrolled (jrn_…)` · `not enrolled — HTTP 404: …` · `skipped — beehiiv upsert
  failed` · `not enrolled — request failed before a response`.
- **`send_welcome_email: false` on the upsert is deliberate.** The automation is
  meant to be the only welcome path. If beehiiv's built-in welcome email is
  switched on later, new subscribers get two emails.

**Until the automation is published**, every submission writes one `degraded`
row to `Errors` and records `not enrolled — HTTP …` on its `Leads` row. That is
intended: a live misconfiguration stays visible without paging hourly. It stops
by itself the moment the automation goes active — no code change needed.

---

## Next steps on beehiiv

Steps 1–3 are UI work. **The beehiiv API exposes only list, get and enrol for
automations — there is no endpoint that creates, authors or publishes one**, so
this cannot be automated from n8n or from a Claude session.

**1 · Build the sequence and publish it.**
In beehiiv → Automations, open the draft currently called `New Automation`.

- Rename it to something identifiable (e.g. `FC · Checklist welcome`).
- **Set a trigger that accepts API enrolment.** It has none today, and beehiiv
  will not publish an automation without one. `POST /journeys` — the call WF-A
  makes — requires the API/manual-add trigger specifically, not a form or signup
  trigger. Confirm the exact label in the UI; if the only options are
  form/signup-shaped, that is worth stopping on rather than guessing.
- Write the emails.
- **Publish**, so the status flips `draft` → `active`.

Renaming is safe: WF-A addresses the automation by ID, never by name. Creating a
*second* automation instead of publishing this one is not safe — the ID in WF-A
would then point at the wrong thing and need updating.

**2 · Watch the KB constraint on the copy.**
Welcome-sequence emails make factual claims about recruiter search and
findability. They are governed by exactly the same rule as the web pages: every
factual statement traces to the FC knowledge base at a stated evidence tier, or
it does not ship. The never-assert list applies in email too — *reply score*,
*Galene powers recruiter search*, *Open to Work boosts your ranking*,
*LinkedIn won't infer skills from your text*, *current title outweighs old
titles*, *top 25 / page one*. Encouraging tone does not license an unsourced
claim.

**3 · Use the segmentation that is already there.**
Every subscriber arrives carrying `function`, `seniority`, `search_stage`,
`score` and `band`. The sequence can branch on `band` or `search_stage` without
any further plumbing — the six-months-plus cohort can be addressed differently
from someone in week two. `score` is numeric, so ranges work.

**4 · Run the test gate.**
Send one real checklist submission and confirm all four:

- the `Leads` row reads `automation_enrolled: enrolled (jrn_…)`
- **no** new `degraded` row in `Errors`
- the subscriber in beehiiv carries all five custom fields
- the first welcome email actually arrives

Then one real Stripe test payment through WF-B, per the original gate.

**5 · Close the open question below** before trusting `function` for
segmentation.

---

## Open questions

- **`tool` → `function` may be mismapped.** WF-A's `Normalise + validate` node
  has a constant `FUNCTION_SOURCE = 'tool'`, mapping the checklist payload's
  `tool` field into beehiiv's `function` custom field. That is right only if
  `tool` carries a job function (`Comms`, `Marketing`). If it carries an
  entry-point label (`findability-checklist`, `v2`), then `function` is being
  populated with junk and segmenting on it will mislead. Resolution: read what
  `findability-checklist.html` actually puts in `tool`. If it is an entry-point
  label, add a real `function` field to the form and flip the constant.
- **Enrolling a real subscriber into a *draft* automation is untested.** The
  endpoint route and body shape are confirmed working (a probe returned
  `404 SUBSCRIPTION_NOT_FOUND` for a non-subscriber address — the route parsed,
  nothing was created). What beehiiv returns for a *real* subscriber against a
  draft automation was not tested, because that would have meant enrolling an
  actual person. WF-A handles any non-2xx generically, so this changes only the
  text logged, never the behaviour.
