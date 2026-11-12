---
status: active
created: 2026-05-04
deepened:
topic: requesthandoff-mvp
origin: docs/brainstorms/requesthandoff-design-requirements.md
plan_depth: standard
---

# RequestHandoff MVP — Implementation Plan

## Summary

A solo-built, 8–12 week MVP delivering an integration-neutral AI receptionist for small local businesses in Austin metro, TX, with two vertical scaffolds at MVP — **General Local Business** (default for any small business: gym, salon, lawyer, electrician, dentist, etc.) and **HVAC** (extends General with emergency urgency rules). Plumbing deferred to v1.1 pending a winter-season design partner. The build splits across three deployables — Vercel (Next.js dashboard), Render Virginia (always-on voice hot path + post-call worker), Supabase `us-east-1` (Postgres + Auth + RLS) — wrapped around Retell AI as the live voice runtime and Vertex AI Gemini 3 Flash as the post-call extraction LLM. The plan sequences twelve weeks: weeks 1–2 land scaffolding + the Retell hot path, weeks 3–4 land lead extraction + dashboard MVP + the pre-demo extractor (the GTM artifact), weeks 5–8 land the integration handoff layer and convert the first 1–3 paying logos via in-person Austin-metro kickoffs, weeks 9–12 polish.

The plan honors the two structural differentiators committed in `STRATEGY.md`: (a) flat-rate pricing with no escalation surcharges, encoded in pricing tier scaffolding and an MVP credit-per-miss policy; (b) integration-neutral handoff, encoded in the post-call delivery fan-out and a small `VoiceRuntime` seam (kept in-file at MVP, not yet a shared package) that keeps product logic out of Retell prompts.

---

## Origin

This plan builds from `docs/brainstorms/requesthandoff-design-requirements.md` (29 R-IDs, 5 acceptance examples, 4 key flows). All R-IDs and AE-IDs referenced in this plan map directly to that document.

Companion documents the plan honors:
- `STRATEGY.md` — canonical positioning + 4 tracks
- `GTM-PLAYBOOK.md` — Austin beachhead, pricing, sales scripts
- `CLAUDE.md` / `AGENTS.md` — workspace + non-negotiable positioning rules
- `docs/PRD.md` — FR1–FR10 spec depth (residual cleanup pass running in parallel with this plan)

**Material changes from the origin doc (already applied to the design doc 2026-05-04):**
- F3 (Onboarding) replaced with **demo-IS-kickoff** — one consolidated call (mode 2: remote) OR an in-person Austin-metro kickoff (mode 1: preferred for first 10 Austin logos). The original "30-min kickoff call after demo" model is dropped.
- R5/R7 vertical scope narrowed: **General Local Business + HVAC scaffolds at MVP**; plumbing deferred to v1.1.
- R18 narrowed: Jobber + email + generic outbound webhook URL at MVP; **HCP deferred to v1.1**; native Zapier app deferred to v1.1.
- R29 implementation: VoiceRuntime seam kept in-file (no shared `packages/voice-runtime` at MVP).

---

## Scope

### In MVP

The 29 R-IDs from the origin doc — restated here as the bounded surface area:

- Voice runtime (Retell), per-tenant playbook composition (**General Local Business + HVAC scaffolds at MVP**; plumbing v1.1), four hot-path function-call endpoints with p99 < 150ms (R1–R3, R5, R6, R8, R9)
- Rule-driven urgency classification + warm-transfer escalation (R10, R11, R13, R14). General scaffold has no urgency rules by default — non-emergency businesses; HVAC scaffold extends General with emergency rules.
- Post-call structured-lead extraction on Gemini 3 Flash with version pinning + context caching (R15)
- Non-English caller fallback: detect non-English → agent says "we'll have someone call you back" in the caller's language → log `non_english_caller` lead with raw audio → alert founder. Never improvise.
- In-process integration fan-out: email (always-on), Jobber (week 5), generic outbound webhook URL field (week 6) for Zapier/Make/n8n catch-all. **HCP and native Zapier app deferred to v1.1.**
- Supabase RLS-based tenant isolation, encrypted PII at rest, no PII in logs (R4, R22, R25)
- Texas one-party-consent recording disclosure baked into greeting (R23)
- Owner-operator dashboard: leads, transcripts, escalation log, plan usage, weekly ROI archive, self-attribution UI, escalation-precision feedback button (R20, R21)
- Render Cron-driven weekly ROI report (R26, F4)
- Platform-native logs + Sentry alerting; per-call COGS telemetry (Retell minutes inbound + outbound transfer + Gemini tokens + Resend sends) from day one; "unprofitable tenant" alert (R27)
- 6-minute soft cap on call duration (auto-escalate or wrap if hit) to bound per-call COGS
- Manual overage tracking for first 50 logos; manual subscription billing via Stripe payment links (no self-serve Checkout flow at MVP — deferred to v1.1) (R28)
- `VoiceRuntime` 3-method seam kept as in-file comment in `services/voice/src/runtime/retell.ts` (no shared package at MVP) (R29)
- 90-day default transcript retention (R12)

### Founder-side tooling (added to the plan beyond the origin doc)

One internal tool surfaced from `GTM-PLAYBOOK.md` + the round 1 review that the origin doc didn't list as a work item but the entire GTM motion now depends on:

- **Pre-demo profile extractor** (Week 4 — pulled forward from Week 6 to precede cold-outreach launch in Week 5) — internal-only Next.js page that takes a website URL + Google Business Profile link, runs a Gemini 3 Flash extraction pass, returns a draft tenant config with **per-field confidence scores** (below-threshold fields rendered yellow/blank, never auto-filled with low-confidence guesses). Generates a **shareable demo URL** (`requesthandoff.com/demo/<id>`) where the prospect clicks → talks to the agent live (inbound, no outbound prospecting calls) → sees the structured lead. This is the entire GTM artifact; cold outreach leads with the demo URL.

**Audit dialer (originally Week 5) is removed from MVP** — proactive outbound prospecting calls are outside scope per founder decision (TCPA exposure + no compelling GTM value once the extractor produces a clickable demo). Industry stats (e.g., "27-40% of HVAC calls go to voicemail") provide the cold-outreach framing without per-prospect verification.

### Explicitly out of scope (per origin doc § Scope Boundaries + decisions made in this plan)

No SMS in any direction at MVP. No proactive outbound prospecting calls (audit dialer dropped). No ServiceTitan integration. No Housecall Pro integration at MVP (deferred to v1.1). No native Zapier app at MVP (replaced with generic outbound webhook URL; native app v1.1). No plumbing vertical scaffold at MVP (added v1.1 with winter-season design partner). No calendar booking, automated quoting, or payment collection in-call. No non-English live conversation (detect + handoff fallback only). No multi-line per tenant. No multi-location complexity. No staffed human fallback. No replacement of the customer's CRM/dispatch/scheduling tool. No self-serve customer-facing onboarding flow. No self-serve Stripe Checkout at MVP (payment links manually issued). No native mobile app. No automated Stripe overage billing. No Twilio voice integration. No Gemini Live API as live voice runtime. No formal metro-2 expansion plan in this MVP (decisions tagged `Austin-specific` should be revisited at logo 25).

---

## Architecture Overview

The architecture is fixed by the origin doc — this plan does not re-decide it. Brief recap so the unit list reads cleanly:

```
                   Caller (PSTN)
                         │
                         ▼
                  Retell AI (DID + voice + STT/TTS + tool calls)
                         │
        ┌────────────────┼─────────────────────┐
        │ mid-call       │ call_ended          │ outbound transfer
        ▼                ▼                     ▼
  services/voice   services/post-call    Retell outbound → owner phone
  (Render Web      (Render Worker)            (warm transfer)
   Service, VA)         │
        │               │
        └───────┬───────┘
                ▼
        Supabase Postgres (us-east-1, RLS)
                │
                ▼
        apps/dashboard (Vercel, Next.js)  ←  Owner-operator browser
                │
                ▼
        Integrations: Resend email, Jobber, generic webhook URL (HCP + native Zapier app v1.1)
```

The three deployables share a typed `packages/schema` (zod + TypeScript types) and a `packages/voice-runtime` (the `VoiceRuntime` interface + Retell implementation). All three ship independently.

---

## Locked Technical Decisions

These are picks I'm locking in this plan to unblock the build. Each has the rationale to defend it; revisit only if the listed assumption breaks.

### D1. Runtime: Node.js 20 LTS + pnpm + Turborepo monorepo

**Why:** Node 20 LTS is the safest target for solo MVP — Vercel and Render both default to it; the entire ecosystem (Next.js 15, Hono, Drizzle, Vitest) ships first-class. Bun is faster but less mature on Render and adds a new variable. pnpm + Turborepo is Vercel's native pattern and gives us a clean monorepo without learning a new tool.

**Revisit if:** A single dependency we need ships Bun-only.

### D2. Dashboard framework: Next.js 15 (App Router, RSC)

**Why:** Vercel-native, server components for lead-list latency, edge-runtime for marketing pages, Supabase Auth helpers ship with first-class Next.js 15 support. App Router handles the marketing-site + auth-ed dashboard split cleanly.

### D3. Hot-path framework: Hono on Render Web Service

**Why:** Hono is the fastest TS web framework that runs on Node, has excellent type inference, and a minimal surface area — important for the <150ms p99 budget. Express adds boilerplate without buying anything. Fastify is comparable but Hono's TS DX is sharper.

### D4. Database access: Drizzle ORM

**Why:** Lighter than Prisma, no separate engine binary, raw-SQL escape hatch that Drizzle exposes cleanly is what RLS policies need. Drizzle's typed queries pair well with `packages/schema`'s zod schemas.

### D5. Validation: Zod (single source of truth for runtime + types)

**Why:** De facto standard in the TS ecosystem; the origin doc's lead-extraction schema (R15) becomes a single zod schema reused by Gemini's `responseSchema`, the dashboard form, the API contract, and the integration handlers.

### D6. Auth for the dashboard: Supabase Auth (email magic-link as primary)

**Why:** Default access pattern for Supabase RLS — the JWT carries `auth.uid()` which RLS policies key off. Auth.js adds a layer that has to be wired into RLS manually. Email magic-link suits owner-operators better than password (one fewer thing to forget). OAuth is out of scope at MVP.

**Revisit if:** A dashboard feature requires custom claims that Supabase Auth's UI flows don't expose cleanly.

### D7. Email provider: Resend

**Why:** Both Resend and Postmark deliver well for B2B SMB volumes. Resend's React Email + modern SDK + cleaner DX wins for solo founder velocity, and pricing is comparable at MVP scale ($20/mo for 50K emails). DKIM/SPF setup is one DNS panel pass for both.

**Revisit if:** Bounce rate exceeds 2% on the first 100 customer-facing sends — switch to Postmark.

### D8. Testing: Vitest + Playwright

**Why:** Vitest is ESM-native, ~3× faster than Jest, and pairs naturally with Vite/Next.js. Playwright is the dashboard E2E baseline; load-testing the hot path uses k6 (out-of-process).

### D9. Failure-mode SLA: $10 credit per missed escalation (MVP rate; revisit at logo 10)

**Why:** Internal commitment, NOT a public pricing-page artifact at MVP. Founder operates with deep partnership for first 5–10 logos and issues $10 credits at discretion when an escalation miss is verified (founder + owner agree). No public refund/credit copy on the pricing page during MVP — keeps GTM friction low.

**Revisit_trigger:** at logo 10, evaluate moving to a public plan-fee-equivalent credit (e.g., $50 or 25% of plan fee per verified miss) once the product is hardened and dispute volume is known. Only then does the wording reach pricing pages and sales scripts.

### D10. Onboarding model: demo-IS-kickoff (consolidated single call) — two delivery modes

**Why:** Owner-operators are time-poor; a separate kickoff call after the demo loses prospects in the gap (per user decision, 2026-05-04).

**Two delivery modes:**

1. **In-person Austin-metro kickoff (preferred for first 10 Austin logos)** — founder drives to the prospect (typically <45 min from Austin to anywhere in Austin metro), brings laptop, runs the demo + approvals + carrier-forwarding setup live in person. Total founder time per close: ~60-90 min including drive. Converts the cognitive-load risk of demo-IS-kickoff into a moat (no Avoca SDR is driving to Pflugerville to set up an HVAC shop). This is the *preferred* motion at MVP, not a fallback.

2. **Consolidated remote demo-IS-kickoff (default for non-Austin or scheduling constraints)** — founder runs the pre-demo extractor (~5 min on prospect data), opens the demo with the **shareable demo URL** (`requesthandoff.com/demo/<id>`) where the prospect listens to the agent answering against their extracted config (collaborative framing: *"I pre-loaded what I could find on your website — let's correct it together"*, NOT confident *"I already built your agent"*). If the owner closes, walks through approvals on the same call (~15-20 min). DID provisioned during the call; carrier forwarding completes within 24h via per-carrier instruction cards or founder screen-share for AT&T business landlines. **Total founder time per close: ~30–40 min.**

**Drop "live before hangup":** the original D10 promised carrier forwarding completed in-call. Carrier conditional-forwarding flows (especially AT&T business landlines) take 15-45 min on hold; same-day async via instruction cards is realistic, in-call is not.

### D11. Texas greeting wording + multi-state warm-transfer hardening (Austin-specific)

**Default greeting:** "Hi, this is [Business Name] — for quality, this call may be recorded. How can I help you today?"

**Why:** Texas is one-party-consent so disclosure is not legally required, but the consistent disclosure is a trust artifact (per origin doc R23). Owner can replace `[Business Name]` and edit phrasing during onboarding.

**Multi-state warm-transfer hardening (added per security-lens round 1 + research):** *Kearney v. Salomon Smith Barney* (CA Supreme Court) establishes that California's all-party-consent law applies whenever a call party is physically in California, regardless of the other side's jurisdiction. Implication: if the warm-transfer flow bridges a Texas caller to an owner currently in California (or another two-party state), the recorded segment may violate that state's wiretapping statute. **Mitigation:** during onboarding, the owner declares their primary state of operation (defaults to TX). If they ever travel to a known two-party-consent state (CA, FL, IL, MD, MA, MT, NH, PA, WA), the dashboard surfaces a warning on the next escalation: *"Recording this transfer may require explicit consent in your current state — consider declining the bridge."* Tagged **`Austin-specific — generalize at logo 25`**.

### D12. Voice persona pick: 2-hour listening test in Week 2

Three Retell voice options evaluated against scripts for both **General Local Business** and **HVAC** scaffolds; pick the one that scores highest on "sounds like a competent local business front desk." Three personas to evaluate: calm dispatcher, friendly receptionist, neighbor-who-knows-the-business. Test recordings filed in `docs/decisions/voice-persona-test-results.md`.

### D13. Subscription billing: Stripe payment links at MVP (Checkout deferred to v1.1)

**MVP approach:** Founder generates a Stripe payment link from the Stripe dashboard during demo-IS-kickoff and emails it to the prospect. Tenant `plan` field set manually in admin tenant editor (U21). No self-serve Stripe Checkout flow, no webhook-driven plan-tier mutations during MVP. Manual overage tracking for first 50 logos.

**Why:** You're on a call with every early customer anyway (D10). Generating a payment link in the Stripe dashboard takes 30 seconds. Building the Checkout + webhook + cancellation-grace-period machinery (originally U25) is engineering time spent on infrastructure for a self-serve funnel that doesn't exist at MVP.

**Revisit:** ship full Stripe Checkout + automated overage billing + cancellation webhooks in v1.1, when self-serve onboarding ships.

### D14. Vertical scaffold strategy: General Local Business + HVAC (plumbing v1.1)

**Two scaffolds at MVP, plus a baseline life-safety layer that applies to ALL scaffolds:**

0. **Life-Safety Baseline (applies to every tenant, every scaffold — round 3 ADV-R3-3):** Hardcoded urgency rules for life-safety language that ANY scaffold inherits:
   - "fire," "smoke," "burning"
   - "flooding," "water everywhere," "burst pipe"
   - "sparks," "shock," "electrical fire," "smell of gas"
   - "medical emergency," "heart attack," "can't breathe," "ambulance"
   - "carbon monoxide," "CO alarm"
   These trigger immediate escalation (warm-transfer to owner) regardless of vertical. **Why baseline:** a property-manager tenant on the General scaffold whose tenant calls about flooding cannot be treated as a routine callback. The General-scaffold-with-no-escalation-ever default is dangerous; the life-safety baseline is the floor.

1. **General Local Business scaffold** — inherits the Life-Safety Baseline. Adds vertical-agnostic intake (services / hours / coverage area / callback request / basic qualification). NO additional urgency rules beyond life-safety. Suitable for any small local business: gym, salon, dentist, lawyer, electrician, landscaper, pet care, etc. This is the **default scaffold** when a tenant doesn't match a specialized vertical.

2. **HVAC scaffold** — inherits General + Life-Safety Baseline. Adds HVAC-specific emergency urgency rules: *system-down + vulnerable occupant*, *no cooling in heat conditions*, *no heat in freeze conditions*. Plus HVAC-specific qualification: equipment age, brand, indoor temperature reading. Activated for tenants whose vertical is set to `hvac`.

**Secondary-services support (round 3 ADV-R3-3):** tenant config has a `secondary_services` field. When set (e.g., HVAC tenant who also does plumbing), the relevant scaffold's urgency rules merge in even if that scaffold isn't a primary at MVP. So a "HVAC + plumbing" tenant gets HVAC + plumbing-keyword rules merged in even though `plumbing.sql` doesn't ship as a primary scaffold.

**Why this strategy beats both alternatives:**
- HVAC-only would be too narrow given the founder doesn't know who'll be the first close (could be a local owner the founder already knows; could be an HVAC owner from cold outreach).
- Fully generic alone is the failure mode (CLAUDE.md positioning rule #4) — for verticals where emergency triage matters, generic intake mishandles burst-pipe / no-cooling / system-down calls.
- Two scaffolds = ~30% more upfront work than HVAC-only, but ~10× more addressable prospects with a graceful default.

**Plumbing scaffold deferred to v1.1** (Sept-Oct 2026) when winter freeze season approaches AND a plumbing design partner is signed. Until then, a plumbing operator who signs would temporarily run on the General scaffold + custom urgency rules added per-tenant.

### D16. Design system canonical: Local Operator Premium (Variant A)

**Canonical visual direction:** "Local Operator Premium" — grounded, local, practical, warm, operationally credible. Feels like a serious tool for owner-operators, not a generic AI SaaS product and not an enterprise dispatch suite.

**Source-of-truth files:**
- `docs/design/requesthandoff-design-system.md` — canonical visual direction, typography, palette, component spec
- `docs/design/requesthandoff-page-patterns.md` — per-page pattern map
- `apps/dashboard/app/design-tokens.css` — implementation tokens (fonts, colors, radius, spacing)
- `apps/dashboard/app/globals.css` — global styles + variant B/C styles preserved as references

**Three modes (per page-patterns.md):**
- **Variant A — Local Operator Premium (canonical):** marketing pages, vertical pages, pricing page, demo-from-website page. Plus Jakarta Sans, warm paper + pine + clay/rust palette, real HVAC/field-service photography.
- **Variant B — Dispatch Console (supporting):** dashboard tables (lead list, escalation log, delivery log, plan usage). IBM Plex Sans/Mono. Dark surface, monospace for timestamps + counts. Dense, scannable, calm.
- **Variant C — Missed Revenue Audit (supporting):** outbound campaign pages (`/missed-call-audit`), revenue proof sections, high-conversion CTAs. Archivo + Work Sans. Cream + rust. Big revenue numbers.

**Implementation rule:** new UI surfaces MUST start from `apps/dashboard/app/design-tokens.css` and follow the pattern map in `requesthandoff-page-patterns.md`. No new fonts or palettes without updating `requesthandoff-design-system.md`.

**Variant B/C preservation:** `/design/option-b` and `/design/option-c` routes stay live until the design system is fully applied to the homepage AND at least one product page (per page-patterns.md). Remove only after weeks 4-5 ship a real owner dashboard built in the Dispatch Console pattern.

### D15. Marketing wedge order: local + flat-rate + integration-neutral first; vertical-specific is supporting proof

**Why (research-confirmed):** Avoca AI has *zero* Austin / Central Texas / Texas customer case studies (verified via Avoca's customer page, May 2026). Avoca's go-to-market clusters in TN, VA/MD, and PA. Goodcall and Numa's case-study geography skews Phoenix/SoCal. Austin is genuinely an **Avoca-light metro**.

**Implication for U17 marketing copy:** the H1/H2 hierarchy on landing pages leads with *local + flat-rate + integration-neutral* — not vertical depth. Vertical playbooks (HVAC emergency triage) appear as supporting proof in the body, not as the headline pitch. This sharpens the wedge in a metro Avoca hasn't claimed; the reverse order would be a parity claim.

**H1 LOCKED (2026-05-04):** **"Every call covered. Every lead handed off."**
Sub-hero: *"RequestHandoff answers when your team can't, qualifies the caller, escalates only by your rules, and delivers a structured lead into the tools you already use."*

The locked H1 collapses two of the three Week-3 candidates into a tighter form (everything-covered + integration-neutral handoff). Picked ahead of Week 3 owner interviews because the design-system pass produced strong copy that already validated the wedge order from D15 (local + flat-rate + integration-neutral first; vertical-specific is supporting proof). Owner interviews in Week 3 still test resonance against this pick — if a clearly stronger alternative emerges, swap.

**H1 candidates considered (kept for record):**
- ~~"An Austin-local front desk that never misses a call. Flat rate. Plugs into your Jobber."~~ — too long for hero typography
- ~~"Every call answered. Every lead in your inbox. No bill shock."~~ — "no bill shock" is a sales objection-handle, not a pride statement
- ~~"Built in Austin for Austin home services. We answer the calls you can't."~~ — preserved as a body-copy proof line, not H1

---

## Repository Layout

Greenfield repo. The plan creates this structure in Week 1:

```
requesthandoff/
├── apps/
│   └── dashboard/                  # Next.js 15 on Vercel
│       ├── app/
│       │   ├── (marketing)/        # public pricing/landing pages
│       │   ├── (auth)/             # magic-link auth flows
│       │   ├── (owner)/            # tenant-scoped: leads, transcripts, escalations, ROI archive
│       │   ├── (admin)/            # founder-only: pre-demo extractor, tenant config editor (audit dialer removed from MVP)
│       │   └── demo/               # public clickable-demo landing pages: requesthandoff.com/demo/<id>
│       ├── lib/                    # Supabase client, server actions
│       ├── components/
│       └── package.json
├── services/
│   ├── voice/                      # Render Web Service (always-on, VA)
│   │   ├── src/
│   │   │   ├── server.ts           # Hono app boot
│   │   │   ├── tools/              # check_hours, check_service_area, request_schedule_window, escalate_now
│   │   │   ├── cache/              # in-process tenant config cache + invalidation
│   │   │   ├── runtime/            # retell.ts (single-file VoiceRuntime seam, 3-method contract documented inline)
│   │   │   └── observability/      # structured logger, latency histograms
│   │   └── package.json
│   └── post-call/                  # Render Background Worker
│       ├── src/
│       │   ├── retell-webhook.ts   # call_ended receiver
│       │   ├── extract/            # Gemini 3 Flash + zod schema
│       │   ├── delivery/           # email, jobber, webhook-url handlers (in-process fan-out; HCP + native Zapier app v1.1)
│       │   ├── retry/              # exp-backoff retry-with-cap
│       │   └── cron/               # weekly ROI report
│       └── package.json
├── packages/
│   ├── schema/                     # zod schemas + TS types shared by all 3 apps
│   ├── supabase-client-rls/        # anon/user JWT only — allowed in apps/dashboard non-admin code
│   └── supabase-client-service/    # service role — allowed only in services/* and apps/dashboard/app/(admin)/*
│   # (packages/voice-runtime collapsed into services/voice/src/runtime/retell.ts — no shared package at MVP)
├── supabase/
│   ├── migrations/                 # SQL migrations (drizzle-kit + supabase migration tooling)
│   ├── policies/                   # RLS policies as SQL
│   └── seed/                       # general.sql (General Local Business scaffold) + hvac.sql (HVAC scaffold)
├── scripts/
│   ├── extractor-cli.ts            # bonus CLI for pre-demo extraction
│   └── load-test-hot-path.ts       # k6 script
├── docs/
│   ├── plans/2026-05-04-001-feat-requesthandoff-mvp.md
│   ├── brainstorms/requesthandoff-design-requirements.md
│   ├── decisions/                  # ADR-style decisions (voice persona, prompt versions, H1 lock)
│   ├── case-studies/               # named-operator + before/after artifacts captured per first-10 logos
│   ├── PRD.md
│   ├── STRATEGY.md  (root)
│   └── GTM-PLAYBOOK.md  (root)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md                       # MUST be rewritten from old GCP stack — Week 1 task
```

---

## Implementation Units

Each unit lists files, dependencies on other units, and test scenarios. Units are grouped by deployable. Cross-cutting units (schema, RLS, observability) come first.

### Cross-cutting

#### U1. Monorepo scaffolding + tooling
- **Files:** `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `tsconfig.base.json`, `.github/workflows/ci.yml`, `.env.example` files in each app.
- **Depends on:** —
- **Implements:** D1, D2, D3.
- **Tests:** `pnpm install && pnpm typecheck && pnpm test` runs clean from a fresh clone. CI green on a no-op PR.

#### U2. `packages/schema` — shared zod schemas + TS types
- **Files:** `packages/schema/src/{tenant,vertical,call,lead,escalation,delivery}.ts`, `packages/schema/src/index.ts`.
- **Depends on:** U1.
- **Implements:** R5, R15 schema (R6 playbook composition uses these types).
- **Test scenarios (Vitest):**
  - Lead schema validates a complete extraction sample (all 11 fields) without errors.
  - Lead schema rejects a payload missing `urgency_level`.
  - Lead schema's `urgency_level` enum is exhaustive across `{standard, elevated, urgent}` — adding a vertical-specific category is a deliberate change requiring a migration of stored leads.
  - Tenant config schema enforces presence of escalation phone when any urgency rule is enabled.

#### U3. Supabase project setup + migration baseline
- **Files:** `supabase/migrations/0000_init.sql` (tenants, users, calls, leads, escalations, deliveries, plan_usage, vertical_scaffolds), `supabase/seed/general.sql` (General Local Business scaffold), `supabase/seed/hvac.sql` (HVAC scaffold extending General). **No plumbing scaffold at MVP** (deferred to v1.1).
- **Depends on:** U2.
- **Implements:** R3 (Postgres in `us-east-1`), R5 (vertical scaffold tables), R12 (transcript retention column with default 90), R20–R21 (lead status + self-attributed value columns), R28 (plan_usage table). Per D14.
- **Schema additions for D14:** `vertical_scaffolds.parent_scaffold_id` (nullable FK) — HVAC scaffold's parent is General; General has parent NULL. Composition at runtime walks the parent chain for default rules.
- **Test scenarios:**
  - Migration applies cleanly to a fresh local Supabase and an empty production project.
  - Seed data inserts both scaffolds (General + HVAC); HVAC's `parent_scaffold_id` points to General.
  - Tenant defaults to General scaffold when no vertical specified; HVAC tenants get HVAC scaffold + inherited General intake fields.
  - Encrypted PII columns (`caller_name`, `caller_phone`, `caller_email`, `caller_address`) use Supabase Vault encryption (R25).
  - Owner's primary state of operation (TX default) stored on tenant row for D11 multi-state hardening.

#### U4. RLS policies for tenant isolation
- **Files:** `supabase/policies/{tenants,calls,leads,escalations,deliveries,plan_usage}.sql`.
- **Depends on:** U3.
- **Implements:** R4, R22.
- **Test scenarios:**
  - User A authenticated as tenant 1 cannot read tenant 2's leads (returns empty rows, not 403, per RLS semantics).
  - User A can read/write their own tenant's leads.
  - Service role (used by `services/voice` and `services/post-call`) bypasses RLS via service-role JWT. **Tenant scoping safety:** tenant_id is NEVER read from inbound webhook bodies. Instead, services derive tenant_id by joining on a server-owned mapping table keyed by Retell `agent_id` (written at provision time, not at call time). Every service-role query carries an explicit `WHERE tenant_id = X` belt-and-suspenders clause even though RLS is bypassed.
  - **Cross-tenant isolation integration test (runs in CI on every PR):** spawn two tenants A and B. Drive a representative dashboard request authenticated as A. Assert no row IDs from B appear in any response payload.
  - **Service-role import isolation:** `packages/supabase-client` is split into `supabase-client-rls` (anon/user JWT only, allowed in `apps/dashboard` non-admin code) and `supabase-client-service` (service role, allowed only in `services/*` and `apps/dashboard/app/(admin)/*`). ESLint rule + CI check enforce the import boundary.
  - **Drizzle + RLS pairing:** dashboard reads go through Supabase JS client (RLS-native via JWT claims), not Drizzle; Drizzle is used only in `services/*` with service-role + explicit tenant_id WHERE clauses. Documented in this unit and tested.
  - SQL injection attempt against the tenant_id parameter does not escape RLS scope.
  - **Spoofed-webhook test:** a Retell webhook body with `tenant_id: B` but `agent_id: A` (where A's mapping points to tenant A) resolves to tenant A — never to tenant B from the body.

#### U5. VoiceRuntime seam (in-file, not a shared package)
- **Files:** `services/voice/src/runtime/retell.ts` — single file containing the Retell webhook receiver + a documented 3-method seam comment block: `startCall`, `onTranscript`, `executeTool`. **No `packages/voice-runtime` directory at MVP.**
- **Depends on:** U2.
- **Implements:** R29 (the runtime-swap hedge — implemented as a structural seam, not as a formal interface).
- **Why no package:** R29's promise is "a future swap is a week of work, not a quarter." That's true with a single-file seam comment as long as Retell-specific code stays inside `runtime/retell.ts` and product logic (playbook composition, urgency rules, lead extraction) stays out of it. Promote to `packages/voice-runtime` only when a second runtime (Vapi, LiveKit Agents, Gemini Live) is within 4 weeks of being evaluated.
- **Test scenarios:**
  - Retell impl correctly maps Retell's `function_call` event to a `tool_handler` function call in `services/voice/src/tools/`.
  - Retell impl correctly maps `call_ended` to an internal trigger that the post-call worker subscribes to.
  - **Architectural test (lint-style):** no Retell SDK imports appear outside `services/voice/src/runtime/retell.ts`. Enforced via ESLint `no-restricted-imports`.
  - Seam-comment block in `retell.ts` documents the 3-method contract and lists the files that would need to change for a runtime swap.

### Hot-path service (`services/voice`)

#### U6. Hono server + health check + tenant config cache
- **Files:** `services/voice/src/server.ts`, `services/voice/src/cache/tenant-config.ts`.
- **Depends on:** U1, U2, U5, supabase-client.
- **Implements:** R8, R9.
- **Test scenarios:**
  - Health check returns 200 in <5ms.
  - Cache miss → DB read → cache populated; second request hits cache (no DB roundtrip).
  - Cache TTL expires correctly; dirty-write invalidates cache via Postgres listen/notify.

#### U7. Four function-call endpoints + call-duration cap
- **Files:** `services/voice/src/tools/check-hours.ts`, `check-service-area.ts`, `request-schedule-window.ts`, `escalate-now.ts`, `services/voice/src/tools/call-duration-guard.ts`.
- **Depends on:** U6.
- **Implements:** R8, R10, R11, R14, AE1, AE5; **6-min soft cap (round 1 finding #11 — bound per-call COGS).**
- **Test scenarios per endpoint:**
  - `check_hours`: returns open/closed correctly across timezone-edge inputs (Sun 11:59pm, DST transitions).
  - `check_service_area`: ZIP inside coverage returns true; ZIP outside returns false with structured "out of area" reason.
  - `request_schedule_window`: returns the next-N available windows based on tenant config; respects tenant scheduling policy.
  - `escalate_now`: resolves active urgency rule from per-vertical scaffold + tenant overrides; returns owner phone + warm-transfer prompt + retry policy. Refuses to escalate if no rule matches (R14, AE3). **Multi-state guard:** if owner's primary state of operation is a two-party-consent state (D11), `escalate_now` returns a recording-disclosure-required flag the agent injects into the warm-transfer brief.
  - **6-minute call-duration cap with explicit exception list (round 3 F5 + ADV-R3-5):** at minute 5:30, agent receives a `wrap_imminent` signal; at minute 6:00 the agent politely closes the call ("I have everything I need — we'll get back to you shortly") and triggers post-call extraction, **UNLESS** any of the following exception conditions hold:
    - **Mid-warm-transfer:** `escalations.status IN ('bridging', 'bridged')` — timer is paused; resumes if bridge fails back to AI
    - **Active urgency-rule trigger:** any urgency rule (life-safety baseline OR vertical-specific) fired in-call within the last 60s — extends to a hard 8-minute ceiling
    - **STT confidence below threshold for last 30s:** caller communication difficulty (heavy accent, hearing-impaired caller, anxious caller) — extends to a hard 8-minute ceiling
  - **Test scenarios for the cap:**
    - 10-minute synthetic call without mid-transfer or urgency: ends at ≤6:30 actual.
    - 6:00 with bridge initiated at 5:50 → bridge fails at 6:30 → AI resumes → call wraps within 60s of bridge failure (NOT immediately).
    - 6:00 with urgency rule fired at 5:45 → call extends to 8:00 hard cap.
    - 6:00 with low-STT-confidence stretch in last 30s → call extends to 8:00 hard cap; partial fields flagged with confidence badges in extraction.
    - 6:00 mid-phone-number-spelling (no urgency, no transfer): hard cap at 6:30 fires; partial phone field flagged in extraction.
  - **Latency:** k6 script (`scripts/load-test-hot-path.ts`) runs 1000 sequential `check_service_area` calls AND a 10-VU concurrent mix of all four endpoints (round 1 adversarial F1 — single-instance contention) against a warm instance with cached tenant config. p99 < 150ms (AE5) under both load shapes.
  - **No LLM on hot path:** static-analysis check ensures no Vertex AI / Anthropic / OpenAI client is imported under `services/voice/src/tools/`.

#### U8. Retell webhook receiver (call lifecycle)
- **Files:** `services/voice/src/runtime/retell-webhook.ts`.
- **Depends on:** U5, U6.
- **Implements:** R1, R2, R29 boundary.
- **Test scenarios:**
  - HMAC signature verification rejects tampered payloads.
  - `call_started` creates a `calls` row.
  - `function_call` is routed to the correct tool handler in U7.
  - `call_ended` triggers the post-call worker via internal HTTP/PgQueue (decision in U10).
  - Replayed webhook (idempotency) does not double-create `calls` rows.

#### U9. Per-tenant playbook composition (General + HVAC scaffolds)
- **Files:** `services/voice/src/runtime/playbook.ts`, called at Retell `startCall`.
- **Depends on:** U2 (tenant + vertical types), U5, U6.
- **Implements:** R6, D14 (vertical scaffold strategy).
- **Test scenarios:**
  - **General Local Business tenant** (e.g., a gym, salon, lawyer) produces a Retell agent config with the General intake (services / hours / coverage / callback request) and **no urgency rules** — agent never escalates regardless of caller language.
  - **HVAC tenant** + Austin coverage area produces a Retell agent config that inherits General intake AND adds HVAC urgency rules + HVAC-specific qualification (equipment age, indoor temp).
  - Tenant-disabled urgency rules drop out of the assembled urgency-rule list passed to Retell.
  - Tenant-added urgency rules append to the scaffold list (cannot weaken core scaffold rules per R10 for HVAC; General has no core rules to weaken).
  - Greeting includes the Texas recording disclosure (R23, D11).
  - **Non-English caller fallback (round 1 finding #10):** Retell-side language-detection signal triggers a fallback path — agent says (in detected language, Spanish + English supported as fallback) "we'll have someone call you back" → ends call → post-call worker logs `non_english_caller` lead with raw audio attached → emails founder with a Sev-2 alert. Agent NEVER improvises in a language the playbook doesn't support. Test: Spanish-only synthetic transcript routes to fallback in 100% of 5 test calls.
  - **Multi-state warm-transfer flag:** when owner's primary state of operation is a two-party-consent state, the assembled playbook injects a recording-disclosure prompt into the warm-transfer brief (D11).

### Post-call worker (`services/post-call`)

#### U10. Webhook ingest + extraction pipeline
- **Files:** `services/post-call/src/retell-webhook.ts`, `services/post-call/src/extract/gemini.ts`, `services/post-call/src/extract/prompt.ts`.
- **Depends on:** U2, U3, U5.
- **Implements:** R12, R15, F1, AE1.
- **Test scenarios:**
  - Webhook ingest persists the transcript and call metadata against the right tenant.
  - Gemini 3 Flash call uses pinned model ID `gemini-3-flash-preview` (string match in code).
  - System prompt + schema + few-shot examples are wrapped in Vertex AI context cache (cache key versioned).
  - Extraction returns a payload validating against the U2 lead schema in **≥48/50 of synthetic golden transcripts** (50-transcript golden set: 25 General Local Business across multiple sub-types — gym, salon, lawyer, dentist, electrician — plus 25 HVAC across the urgency dimensions). 100% pass rate on a 50-set is statistically meaningful for a >99% reliability claim; the original 10-transcript set was insufficient (round 1 adversarial F6).
  - Schema-validation failure routes to a retry with a corrective prompt; second-try failure routes to a manual-review queue (logged in Sentry as a Sev-3).
  - **Non-English caller transcript:** routes to the U9 non-English fallback path; lead recorded with raw audio attachment; no extraction attempted.
  - **Per-call cost telemetry** recorded against `plan_usage`:
    - Retell inbound minutes (priced at $0.07-0.13/min realized)
    - **Retell outbound transfer minutes (added per round 1 finding #11)** — separate column, since urgent escalation calls accrue meaningful outbound minutes
    - Gemini 3 Flash input tokens + output tokens × pinned price; cached tokens counted at 10%
    - Resend sends count
  - **"Unprofitable tenant" alert:** if a tenant's 7-day rolling per-call COGS exceeds the tier overage threshold (e.g., Starter tier > $0.15/call avg), Sentry alert fires; founder reviews in admin COGS dashboard.

#### U11. Delivery fan-out: email handler
- **Files:** `services/post-call/src/delivery/email.ts`, email templates under `services/post-call/src/delivery/templates/`.
- **Depends on:** U10, Resend SDK.
- **Implements:** R16, R17, AE4.
- **Test scenarios:**
  - Email handler delivers a structured-lead summary to the tenant's `escalation_email` address.
  - Failure (Resend 5xx) triggers retry-with-backoff (cap 5 attempts).
  - Email handler success/failure does not block the Jobber and webhook-URL handlers (try/catch isolation). HCP and native Zapier app handlers are deferred to v1.1.

#### U12. Delivery fan-out: Jobber handler (Week 5)
- **Files:** `services/post-call/src/delivery/jobber.ts`, OAuth flow under `apps/dashboard/app/(owner)/integrations/jobber/`.
- **Depends on:** U11 (delivery loop pattern), Jobber API access.
- **Implements:** R18, AE4.
- **Test scenarios:**
  - OAuth flow stores per-tenant Jobber token in `supabase.vault`.
  - Lead becomes a Jobber Request with caller name, phone, service, urgency, location, preferred window, recommended next action.
  - 503 from Jobber retries with backoff; does not block other handlers.
  - Token-expired (401) triggers a re-auth notification email to the tenant.

#### U13. ~~HCP handler~~ — DEFERRED TO v1.1
HCP integration is deferred to v1.1 per round 1 + 2 scope review. Reasoning: smaller Austin TAM (~1.5k operators) makes it more likely the first paying cohort clusters on one CRM (Jobber or paper-calendar+email), not two; Jobber + email + generic webhook URL covers the integration-neutral handoff promise for first paying logos. HCP partner-certification timeline (1-4 weeks) was a meaningful blocker on Week 8. **Reactivation trigger:** if Week 3 owner-interview pass shows ≥30% of 5+ interviewed Austin operators use HCP, pull HCP forward into Weeks 9-10.

#### U14. Delivery fan-out: generic outbound webhook URL field (Week 6)
- **Files:** `services/post-call/src/delivery/webhook-url.ts`; tenant settings field added in U20.
- **Depends on:** U11.
- **Implements:** R19 (long-tail integration coverage) — replaces the original "private Zapier app" approach per round 1 scope finding.
- **Why this beats a native Zapier app at MVP:** 90% of the value (lead JSON delivered to any destination) for 5% of the build (~2 days vs 3-4 weeks for a native Zapier app with partner-review cycle). Customer pastes their Zapier/Make/n8n webhook URL into tenant settings; we POST the structured lead. Native Zapier app is deferred to v1.1.
- **Test scenarios:**
  - Tenant pastes a webhook URL in settings → next captured lead posts the structured lead JSON to that URL within the post-call worker's delivery fan-out.
  - 5xx responses retry with exponential backoff; 4xx responses log + surface in dashboard integration health.
  - Test integration end-to-end: lead → Make.com webhook → Google Sheets row. Documented in `docs/decisions/`.
  - Header includes `X-RequestHandoff-Signature` HMAC for the customer to optionally verify the post is genuine.

#### U15. Urgency escalation logging + outbound retry
- **Files:** `services/post-call/src/retry/escalation.ts`, escalation log writes to `escalations` table.
- **Depends on:** U7, U8, U10.
- **Implements:** R11, R13, AE2.
- **Test scenarios:**
  - `escalate_now` invocation creates an `escalations` row before Retell places the outbound call.
  - Owner-pickup outcome (`answered`) updates the row with ring duration + outcome.
  - Owner-no-answer triggers a second outbound attempt after exponential backoff, then logs `outcome: no-answer` and emails the owner the missed-call lead summary marked as `urgent_unbridged`.
  - No urgency rule match → `escalate_now` is never invoked → no `escalations` row → lead has `urgency: standard` (AE3).

#### U16. Weekly ROI report cron
- **Files:** `services/post-call/src/cron/weekly-roi.ts`, Render Cron Job manifest.
- **Depends on:** U10, U11.
- **Implements:** R20, R26, F4.
- **Test scenarios:**
  - Cron fires at 7am local-tenant time; respects tenant timezone column.
  - Report aggregates: calls covered, qualified leads, urgent escalations, owner-marked job conversions, sum of self-attributed value.
  - Email delivery uses U11's email handler.
  - No-data tenant (zero calls last week) gets a friendly "quiet week" email, not a blank report.

### Dashboard (`apps/dashboard`)

#### U17. Marketing/landing pages + pricing page (D15 wedge re-rank + D16 design system)
- **Pattern reference:** `docs/design/requesthandoff-page-patterns.md` Homepage Pattern, Pricing Page Pattern, Demo-From-Website Pattern, Missed-Call Audit Page Pattern.
- **Style:** Variant A (Local Operator Premium) for `/`, `/pricing`, `/how-it-works`, `/demo/<id>`. Variant C (Missed Revenue Audit) for `/missed-call-audit` — separate cold-outreach landing page used in Week 5 outreach.
- **Hero placeholder note:** the homepage hero shows a `Recovered this week: $8,740` proof number. This is a PLACEHOLDER. Replace with real number from logo-1 weekly ROI report (per R2-D case study capture) before any public launch. Track in `docs/case-studies/`.
- **Integration list scope:** the homepage integration list (Jobber, Housecall Pro, Slack, Google Sheets, Email, Webhook) reflects what RequestHandoff DELIVERS to, not what it natively integrates with at MVP. Native MVP integrations: Email + Jobber + generic webhook URL. HCP/Slack/Sheets are deliverable today via the webhook URL → Zapier/Make path; this is honest because the integration-neutral promise is "lead lands where you already work," not "we wrote a native connector." Native HCP + native Zapier app are v1.1.
- **Files:** `apps/dashboard/app/(marketing)/{page,pricing,how-it-works}.tsx`.
- **Depends on:** U1.
- **Implements:** CLAUDE.md positioning rules #1, #5, #6, #8; **D15 wedge re-rank**.
- **Wedge order on the page (per D15, research-confirmed Avoca-zero-Austin):**
  1. **Local + flat-rate + integration-neutral** (H1 / H2 / hero) — these are the structural differentiators Avoca/ServiceTitan/Smith.ai don't own in Austin.
  2. **"Every call answered, every lead in your inbox" outcome promise** (sub-hero).
  3. **Vertical-specific behavior (HVAC emergency triage, General-business intake)** appears as supporting proof in the body, NOT as headline.
- **Test scenarios:**
  - Pricing page lists $79 / $179 / $349 + $0.49 overage with no escalation fees footnote (CLAUDE.md positioning rule #5). **No public credit-per-miss wording at MVP** (per D9 revisit_trigger).
  - **D15 H1 deny-list snapshot test:** Playwright snapshots H1/H2 text and asserts against a deny-list of forbidden lead phrases: "AI receptionist", "AI agent", "voice AI", and "vertical-specific" (the last because vertical depth is supporting proof, not headline at MVP per D15).
  - **H1 candidates to test in Week 3 owner interviews** (lock by Week 4):
    - "An Austin-local front desk that never misses a call. Flat rate. Plugs into your Jobber."
    - "Every call answered. Every lead in your inbox. No bill shock."
    - "Built in Austin for Austin home services. We answer the calls you can't."
  - Body content includes case-study artifacts from `docs/case-studies/` (R2-D) once weeks 5-10 produce them.
  - **Avoca-light positioning content** (research-confirmed): one body section frames "Austin-local, not flying-in-from-Phoenix" as a specific differentiator vs AI-receptionist competitors who haven't shipped in Texas.

#### U18. Auth flows (Supabase Auth magic-link)
- **Files:** `apps/dashboard/app/(auth)/{login,callback}/page.tsx`, `apps/dashboard/lib/supabase/{server,client}.ts`.
- **Depends on:** U3, Supabase Auth setup.
- **Implements:** D6.
- **Test scenarios:**
  - Magic-link email arrives within 60s of submit.
  - Callback exchanges the code for a session and redirects to `(owner)/leads`.
  - Session cookie set with `httpOnly` + `secure`.
  - Logout clears the session and redirects to `/`.

#### U19. Owner dashboard — leads + transcripts + escalations + precision feedback (Variant B Dispatch Console)
- **Pattern reference:** `docs/design/requesthandoff-page-patterns.md` Dashboard Pattern. Use Variant B Dispatch Console — dense, scannable, calm. IBM Plex Sans/Mono, dark surface, monospace for timestamps + counts.
- **Lead list columns** (per pattern doc): Time, Caller, Service issue, Urgency, Handoff destination, Status.
- **Lead detail sections** (per pattern doc): Structured lead summary, Call transcript as secondary, Escalation attempts, Delivery attempts, Owner outcome marking.
- **Files:** `apps/dashboard/app/(owner)/leads/page.tsx`, `[leadId]/page.tsx`, `transcripts/[callId]/page.tsx`, `escalations/page.tsx`.
- **Depends on:** U3, U4, U18.
- **Implements:** R20, R21; **escalation precision feedback loop (round 1 finding #12 — STRATEGY metric #2).**
- **Test scenarios:**
  - Lead list shows last 30 days; tenant-scoped via RLS. Sort default: urgent-unread first, then newest. Urgent escalations have a visual badge distinct from standard new leads (round 1 design DESIGN-001 fix).
  - Lead detail shows structured fields prominently; transcript is collapsible/secondary (CLAUDE.md positioning rule #8). **Confidence-score badge** (DESIGN-002): when extraction confidence is below threshold, lead detail shows "Agent may have missed details — review transcript" prompt that auto-expands the transcript.
  - Self-attribution UI: status select (`new / contacted / booked / lost / spam`) + dollar-value input when status = booked. Inline micro-copy: "Marking 'booked' + entering value adds this to your weekly ROI report."
  - Escalation log shows timestamp, target number, ring duration, outcome (R13 fields).
  - **NEW: "Wasn't actually urgent" button on each escalation row** (round 1 finding #12). Click → records false-positive feedback → updates per-tenant + global precision rate visible in founder COGS dashboard (Week 7). Per STRATEGY metric #2: false-positive escalations destroy trust faster than misses.
  - Empty states defined for: leads list (first-session: "Your line is live. The next call that comes in while you're unavailable will appear here."), escalation log, ROI archive (round 1 design DESIGN-004 fix).
  - Integration-failure state: Jobber 401 / webhook-URL 5xx → persistent banner on leads list with "Reconnect" CTA (round 1 design DESIGN-005 fix).

#### U20. Owner dashboard — plan usage + ROI archive + tenant config + integration settings
- **Files:** `apps/dashboard/app/(owner)/{usage,reports,settings,integrations}/page.tsx`, `apps/dashboard/components/CarrierForwardingCard.tsx`.
- **Depends on:** U19.
- **Implements:** R20, R28.
- **Test scenarios:**
  - Usage page shows calls used vs included for the current billing cycle.
  - ROI archive paginates past weekly reports.
  - Settings: hours, services, escalation phone, **owner's primary state of operation** (TX default; D11 multi-state hardening), Texas-greeting override field. Greeting override field has a "preview as spoken" button that calls a Retell TTS endpoint and plays back a 5-second sample (round 1 design DESIGN-003 fix).
  - **Integrations page:** outbound webhook URL field (U14), Jobber connect button. HCP connect button is grayed out with "Coming in v1.1" tooltip.
  - **Per-carrier conditional-forwarding instruction cards** (round 1 finding #3, research-corrected codes):
    - **AT&T mobile / T-Mobile:** "Forward when busy: dial `**67*<our-DID>#`. Forward when no answer: dial `**61*<our-DID>#`. Disable: `##67#` or `##61#`."
    - **Verizon mobile:** "Settings app → Calls → Call forwarding → set forward-when-no-answer to <our-DID>" (Verizon's GSM codes vary by plan; web-portal path is more reliable).
    - **AT&T business landline:** "Use the AT&T BusinessCenter web portal — instructions and screenshots provided. Or schedule a 10-min screen-share with us."
    - **Spectrum business voice:** "Spectrum Business Voice Manager → Call Forwarding → Selective."
  - **D11 multi-state warning banner:** if owner's declared state changes to a two-party-consent state, the next escalation page shows "Recording this transfer may require explicit consent in your current state — consider declining the bridge."

#### U21. Founder admin: tenant config editor (multi-tenant view)
- **Files:** `apps/dashboard/app/(admin)/tenants/page.tsx`, `[tenantId]/edit/page.tsx`, `apps/dashboard/lib/auth/require-founder.ts`.
- **Depends on:** U19, founder-only RLS bypass.
- **Implements:** R7 (white-glove onboarding).
- **Authorization model:** Founder identity is gated by a `founder: true` custom claim in the Supabase JWT (set via Supabase Dashboard for the founder's auth user). Every `(admin)/*` page route AND every `/api/admin/*` API route handler calls `requireFounder()` server-side as the FIRST line of code. The 404 page-route redirect is a UX nicety, not the security boundary — the API routes are protected independently.
- **Test scenarios:**
  - Founder can switch between any tenant; non-founder authenticated user gets 404 from page routes AND 403 from `/api/admin/*` routes.
  - **Direct API call test:** an authenticated owner-operator without the founder claim calls `/api/admin/audit` and `/api/admin/extract` with valid session cookies — both return 403, no Retell or Gemini side effects fire.
  - Anonymous (unauthenticated) requests to `/api/admin/*` return 401.
  - Edits write back to the same tables RLS protects for owner-side reads.

### Founder-side internal tools

#### U22. Pre-demo profile extractor + shareable demo URL (Week 4 — pulled forward) (Variant A demo-from-website pattern)
- **Pattern reference:** `docs/design/requesthandoff-page-patterns.md` Demo-From-Website Pattern. Variant A (Local Operator Premium). Lead-card proof object as the conversion artifact. Subtle confidence states, not loud warnings.
- **Files:** `apps/dashboard/app/(admin)/extractor/page.tsx`, `apps/dashboard/app/api/admin/extract/route.ts`, `apps/dashboard/app/demo/[demoId]/page.tsx` (public demo landing), `apps/dashboard/app/api/demo/[demoId]/connect/route.ts` (Retell web-call session token endpoint).
- **Depends on:** U10 (Gemini setup), U21.
- **Implements:** D10 (demo-IS-kickoff onboarding model), GTM wedge artifact. Now load-bearing for the entire prospecting motion since the audit dialer is removed from MVP.
- **Build cost: ~5-6 days (was 3-4 days before audit-dialer was dropped).**
- **Why pulled forward to Week 4:** cold outreach using the demo URL begins Week 5; without U22 ready, early demos fall back to generic and miss the converting moment (round 2 SG-06).
- **Test scenarios:**
  - Founder pastes website URL + GBP link; system fetches both, runs Gemini 3 Flash extraction, returns a tenant config draft (services, hours, coverage area, vertical guess: General | HVAC) within 30s.
  - **Per-field confidence scores** (round 1 finding #13): every extracted field returns with confidence 0–1; UI renders below-threshold fields as **yellow/blank** (NOT auto-populated with low-confidence guesses). Founder must explicitly confirm or fill below-threshold fields before going live.
  - Founder reviews + confirms; Save creates a pending tenant in `tenants` table with `status: draft` AND generates a **public demo URL** at `requesthandoff.com/demo/<demoId>`.
  - **Public demo URL behavior:** prospect clicks → lands on a page with the prospect's business name + agent description → "Try the demo" button initiates a Retell web-call (browser audio, no PSTN, no outbound prospecting call). Prospect talks to the agent for up to 90 seconds → call ends → page shows the structured lead the agent captured. Demo URL expires 14 days after creation.
  - **Architecture (research-confirmed 2026-05-04):** ONE shared `demo` Retell agent, separate from the production paying-tenant agent. Per-session token created server-side at click time with the per-prospect extracted config injected as a dynamic prompt. Per-session cost ~$0.10-0.12 (Retell voice $0.07/min + LLM ~$0.04/min × 1.5 min avg).
  - **Abuse protection (round 3 ADV-R3-1 — load-bearing):**
    - **Hard cap of 3 web-call sessions per demo ID**, surfaced in UI as "Demo expires after 3 listens or 14 days, whichever first."
    - **Per-IP rate limit:** 1 session per IP per 60 minutes at the `/api/demo/[id]/connect` route.
    - **Cloudflare Turnstile** (or equivalent CAPTCHA) on the connect button — bots cannot initiate sessions.
    - **Daily Retell-spend circuit-breaker** in U24 observability: if projected monthly demo-agent spend exceeds $200/mo budget, all `/demo/*` URLs return a "Demo temporarily unavailable — contact founder" page until the next billing cycle or founder manually resets.
    - **Separate Retell agent for `/demo/*`:** demo abuse cannot rate-limit or knock the production paying-tenant agent offline.
    - **Founder real-time alert:** demo session start → Slack/email notification with prospect business name + demo ID. Founder can call the prospect within 30 minutes regardless of outcome.
  - **In-call self-disclosure (round 3 ADV-R3-2):** the demo agent's opening line is *"Hi, I'm a preview agent built from your business website — I might get some details wrong, so please correct me as we go."* This frames fallibility into the voice itself, not just the cold-outreach email. Without this, a confidently-wrong demo answer is a one-shot kill.
  - **Founder pre-flight check:** before sending a demo URL in cold outreach, founder must run a 90-second self-test on the URL and click "Approve for outreach" in the admin UI. This is a checklist gate, not optional.
  - **COGS telemetry:** new `demo_session_cost` column in `plan_usage` (or a separate `demo_sessions` table) tracks Retell minutes burned per demo. Surfaces in founder COGS dashboard so spend stays bounded.
  - **Anti-hallucination opening framing** (round 1 finding #13, round 2 PROD-R2-1): cold-outreach copy uses *"I pre-loaded what I could find on your website — let's correct it together"*, NEVER *"I already built your agent."* The collaborative framing converts unknowns from sales liabilities into trust artifacts.
  - **Insufficient data on website** → extractor flags missing fields explicitly with red badges and a summary at the top of the draft.
  - **Week 6 rehearsal:** founder runs the extractor on 10 random Austin HVAC + General prospects and grades hallucination rate. If rate >20%, tighten extraction prompt before live use (round 1 adversarial ADV-2).

<!-- U23 audit dialer REMOVED from MVP per founder decision 2026-05-04. Reasoning: outbound prospecting calls carry TCPA exposure ($500-1500/call statutory liability), and the pre-demo extractor + shareable demo URL (U22) replaces the audit dialer's GTM role with a stronger artifact (interactive demo prospects can try). Industry stats ("27-40% of HVAC calls go to voicemail") provide cold-outreach framing without per-prospect verification. -->


### Operations + observability

#### U24. Sentry + structured logging
- **Files:** `services/voice/src/observability/{logger,sentry}.ts`, `services/post-call/src/observability/...`, `apps/dashboard/sentry.{client,server,edge}.config.ts`.
- **Depends on:** U6, U10, U18.
- **Implements:** R27.
- **Test scenarios:**
  - Hot-path tool call emits a single structured log line with `tenant_id`, `tool`, `latency_ms`, `outcome`.
  - Sentry alert fires when p95 latency on `services/voice` exceeds 200ms for 5 minutes.
  - PII fields (caller name, phone, email, address) are scrubbed by a Sentry beforeSend hook (R25 verification).

#### U25. Stripe payment links + manual plan-tier setting (D13 — Checkout deferred to v1.1)
- **Files:** `apps/dashboard/app/(admin)/tenants/[tenantId]/billing.tsx` (founder admin view, NOT a self-serve owner-facing flow at MVP).
- **Depends on:** U21.
- **Implements:** D13, R28.
- **MVP approach:** Founder generates a Stripe payment link via the Stripe dashboard during demo-IS-kickoff. Emails it to the prospect. Sets `tenants.plan` manually in U21 admin tenant editor. Manual overage tracking for first 50 logos.
- **Test scenarios:**
  - Founder admin can set tenant `plan` to Starter | Growth | Pro from the admin tenant editor; change is reflected in `plan_usage.included_calls` immediately.
  - Founder admin can mark a tenant as `cancelled`; Retell DID disabled after 30 days (cron in U16 enforces).
  - **No webhook handler at MVP.** No `/api/stripe/webhook` route. No self-serve `/api/stripe/checkout` route.
- **Deferred to v1.1 (originally specified for MVP):**
  - Self-serve Stripe Checkout flow at `/billing`.
  - Webhook handler with HMAC `Stripe-Signature` verification + raw-body handling (kept as a v1.1 spec).
  - OAuth token cleanup on cancellation (currently manual; the Jobber token can be revoked via the admin tenant editor; HCP cleanup deferred since HCP itself is v1.1).

---

## Sequencing — Week-by-Week

**Solo founder, target: first paying logo live by Week 8 via in-person Austin-metro kickoff. Two-week buffer (weeks 11–12) for the unknowns that will surface.**

### Week 1 — Foundation
- U1 monorepo scaffolding (Next.js 15, Hono, Drizzle, Vitest, Turborepo, pnpm)
- U3 Supabase migration baseline + seed playbooks (**General + HVAC** scaffolds; no plumbing at MVP)
- U4 RLS policies + service-role import boundary (eslint-plugin-import `no-restricted-imports`, ~2 hours per round 2 SG-08)
- U2 schema package
- U5 VoiceRuntime seam (single file in `services/voice/src/runtime/retell.ts`)
- **Rewrite README.md** to reflect Vercel + Supabase + Render stack + Austin beachhead — critical for future Claude sessions
- **Update design doc R7 + F3** to reflect the demo-IS-kickoff model (already done)
- **Schedule 5 owner interviews** in weeks 2–3 — mix of HVAC owners (cold outreach in Austin) AND any local relationship the founder already has (gym, salon, etc.) to test General scaffold reception
- Render + Vercel + Supabase + Sentry accounts provisioned
- Resend account provisioned; DKIM/SPF set on production domain
- **Apply for Jobber partner access** (R-D mitigation: 1-4 week wait, start now)

### Week 2 — Hot path + Retell wiring
- U6 Hono server + tenant config cache
- U7 four function-call endpoints + 6-min call-duration cap
- U8 Retell webhook receiver + agent_id→tenant_id mapping
- U9 per-tenant playbook composition (General + HVAC dual-scaffold) + non-English fallback
- **Voice persona listening test (D12)** — 2 hours against both General and HVAC scripts; decision filed in `docs/decisions/voice-persona-test-results.md`
- First end-to-end test call (founder calls a Retell DID, agent runs General OR HVAC playbook, hot path responds)
- **Composed prompt-budget check (round 3 F6):** measure HVAC scaffold's composed prompt size (Life-Safety Baseline + General intake + HVAC additions) against Retell's documented per-agent prompt limit. If close to ceiling, document the constraint in `docs/decisions/scaffold-prompt-budget.md` and budget for a pruning step at scaffold #5+ (v1.1 plumbing, etc.)

### Week 3 — Post-call extraction + email + owner interviews
- U10 webhook ingest + Gemini 3 Flash extraction (50-transcript golden set: 25 General + 25 HVAC)
- U11 email handler via Resend
- U18 dashboard auth (Supabase Auth magic-link)
- U24 Sentry + structured logging baseline
- **5 owner interviews complete** — incorporate verbatim urgency phrases into HVAC scaffold; test which D15 H1 candidate resonates most. **Stretch to 10 interviews if feasible** (round 3 ADV-R3-9 — N=5 is statistically blind to a 30% prevalence trigger).
- **Per-carrier instruction card validation (round 3 F4):** ask 2-3 owners to walk through their current carrier conditional-forwarding screen on screen-share. Validate each card against a real instance. Cost: ~2 hours. Without this, Week 8 in-person kickoff stalls if a card is wrong.
- **Resend deliverability test** from a Travis County IP block; if bounce rate >2%, switch to Postmark per D7

### Week 4 — Dashboard MVP + extractor (pulled forward)
**Round 3 F1 fix:** Week 4 was overloaded with 6 work items + acceptance examples + reliability gate. Split: Week 4 lands the dashboard + extractor; Week 5 lands escalation logging + AE acceptance + reliability gate (which runs as background across Weeks 4-5).
- U19 leads + transcripts + escalations views + escalation precision feedback button
- U20 plan usage + tenant config + Texas greeting override + per-carrier forwarding instruction cards + state-of-operation field
- U21 founder admin tenant config editor + `requireFounder()` enforcement
- **U22 pre-demo profile extractor + shareable demo URL + abuse protection** — pulled forward from Week 6 (per round 2 SG-06). Includes Cloudflare Turnstile, per-IP rate limit, hard 3-session cap, daily Retell-spend circuit-breaker.
- **Begin 100-call warm-transfer reliability gate IN BACKGROUND** — placing 100 outbound bridges with caller-perceived heard-audio scoring is multi-day; results land Week 5 mid-week pass/fail decision (round 3 F1).
- **Synthetic-monitor canary:** continuous outbound test call/hour to a tracking number to detect silent failures (round 1 adversarial ADV-3)

### Week 5 — Escalation + Jobber + cold outreach launch + reliability gate decision
- **U15 escalation logging + outbound retry** (moved from Week 4 per round 3 F1)
- **AE1, AE2, AE3, AE5 acceptance examples** pass end-to-end on a single tenant (moved from Week 4)
- **Reliability gate decision (mid-week):** 100-call sample completes; pass requires ≥95% caller-perceived heard-audio in 10s. Fail → accept gap into v1.1 prioritization (no SMS pulled into MVP given founder's no-outbound-prospecting decision); document mitigation as urgency-rule frequency cap.
- U12 Jobber integration (OAuth + lead create) — **Jobber free sandbox + GraphiQL is available immediately on signup** (research-confirmed); custom-integration partner approval is needed only for ≥6 paying logos. Build entirely against sandbox at Week 1-5, then ship customer-facing OAuth in Week 5 + email `api-support@getjobber.com` Week 1 to start the partner-approval clock for production.
- AE4 acceptance example (parallel email + Jobber delivery; Jobber 503 doesn't block email) passes
- **Cold outreach begins via the shareable demo URL (U22):** founder targets ~150 Austin HVAC + General-business prospects with extractor-generated demo links + a one-line ask, scaled UP from original 30 because demo-URL conversion is a load-bearing unknown — research benchmarks suggest 32% SMB demo-to-close but cold-email click-through is realistically 2-5%, so 30 sends → ~1 demo session is unacceptably thin signal. NO outbound calls, NO TCPA exposure.
- **Founder time budget for personalized outreach:** 5 min/prospect × 150 = ~12-16 hours across the week. Realistic but tight; founder should template the cold-outreach email body and only personalize the demo URL link + one sentence per prospect.


### Week 6 — Webhook URL integration + COGS telemetry foundation
- U14 generic outbound webhook URL field (replaces original Zapier private-app scope; ~2 days)
- U25 Stripe payment-link approach — manual plan setting via admin tenant editor (replaces full Checkout flow)
- COGS telemetry includes outbound transfer minutes (round 1 finding #11)
- **GTM Validation Gate #1 (Week 6 checkpoint):** if <3 demos booked from the cold-outreach URL push by end of Week 6 → pause integrations work, run customer-development sprint to refine the demo URL message.

### Week 7 — ROI report + COGS dashboard + escalation precision
- U16 weekly ROI report cron
- Self-attribution UI complete (U19)
- **Per-call COGS telemetry founder dashboard** showing Retell inbound + outbound transfer + Gemini tokens + Resend sends per tenant per call, plus **escalation precision rate** (round 1 finding #12 — STRATEGY metric #2)
- "Unprofitable tenant" alert in COGS dashboard
- Per-call cost validation: confirm we're under $0.15/call target on average; flag tenants exceeding tier overage threshold

### Week 8 — First paying logo (in-person kickoff preferred)
- **First paying logo onboarding via in-person Austin-metro demo-IS-kickoff (D10 preferred mode)** — founder drives to the Austin-metro prospect, brings laptop, runs demo + approvals + carrier-forwarding setup live. ~60-90 min including drive.
- **Capture case-study artifact** for the first logo (R2-D — named operator, audit before/after numbers, one-line testimonial, peer-intro ask) → loads `docs/case-studies/`. This is the FIRST opportunity to capture; if a tenant signs earlier in Week 5-7, capture opportunistically — the planned target remains Week 8.
- Production smoke tests on real call traffic begin
- **GTM Validation Gate #2 (Week 8 checkpoint):** if 0 closes by end of Week 8 → demo-IS-kickoff thesis fails → switch to 14-day sandbox-first model (see Sandbox-First Fallback section below for spec).

### Week 9 — Polish round 1 + second logo
- Polish round 1: dashboard UX from first-logo feedback, copy audits per CLAUDE.md positioning rules + D15 wedge re-rank
- Second paying logo onboarded (in-person if Austin-metro)
- Capture case-study #2

### Week 10 — Polish + load test + third logo
- Polish round 2
- Load test hot path at 10× production volume (k6 script, U7) — concurrent-load shape, not just sequential (round 1 adversarial F1)
- Third paying logo onboarded
- Capture case-study #3

### Week 11 — Buffer
- Address bugs from first 3 paying tenants
- v1.1 backlog grooming: HCP integration, native Zapier app, plumbing scaffold (winter design partner sourcing), automated Stripe Checkout + overage billing, SMS, ServiceTitan, public credit-per-miss SLA, multi-line, Spanish live conversation

### Week 12 — Buffer + retro
- Final bug fixes
- **Capture institutional learnings** in `docs/solutions/` (e.g., latency budget patterns, RLS multi-tenant patterns, demo-URL conversion rates)
- **Calendar reminder set: ~2026-07-01** to re-check live voice runtime swap triggers (R29 + origin doc Deferred to Planning #8)
- **Logo 10 readiness check:** evaluate moving D9 SLA to a public plan-fee-equivalent credit (currently parked at $10 + founder discretion)

---

## GTM Validation Gates

These are explicit pivot triggers added per round 1 finding #9 + round 2 PROD-R2-2 + **round 3 ADV-R3-4 (gates measure conversion ratios, not absolute counts, to avoid pass-theater)**. They prevent 12 weeks of code from landing on a broken wedge.

Each gate uses **conversion ratios** as the primary signal (statistically meaningful) plus an absolute floor (sanity check). N=3 absolute counts are statistically indistinguishable from luck.

- **Gate #1 (Week 6):**
  - **Primary signal:** demo-URL-click → demo-session-start ≥ **30%** AND demo-session-start → "interested in kickoff call" reply ≥ **15%** (across ≥30 demo URL sends).
  - **Absolute floor:** ≥3 demos completed AND ≥1 kickoff conversation booked.
  - **Pass:** proceed to Week 7.
  - **Fail (either ratio low):** pause integrations work in Week 7. The signal:
    - High clicks + low session-starts → demo URL CTA is wrong; iterate copy.
    - High session-starts + low kickoff replies → demo *is* entertainment, not a buying signal; iterate cold-outreach framing AND test D15 H1 candidates with 5 cold-call discovery interviews.
- **Gate #2 (Week 8):**
  - **Primary signal:** kickoff-conversation → close ≥ **25%** (founder's gut check on whether prospects are *seriously* engaging; this is the qualitative-judgment ratio).
  - **Absolute floor:** ≥1 paying logo closed via demo-IS-kickoff.
  - **Pass:** continue with Week 9 polish.
  - **Fail:** demo-IS-kickoff thesis fails. Switch to **14-day sandbox-first model** (see Sandbox-First Fallback below).
- **Gate #2.5 (NEW — round 3 ADV-R3-4 high-volume-no-close trigger):** if >20 demo loads AND 0 kickoff replies by Week 7, the demo URL is entertainment not a buying signal — switch to direct-sales motion (founder dials prospects after they've completed a demo, owns relationship-build time) before Gate #2 fires.
- **Gate #3 (Week 10):**
  - **Primary signal:** cold-outreach → paying-logo ≥ **2%** (industry SMB benchmarks expect 5%; 2% is the floor for solo-founder-on-12-week-clock to be sustainable).
  - **Absolute floor:** ≥3 paying logos.
  - **Pass:** continue v1.1 prep.
  - **Fail:** re-evaluate the wedge in Week 11-12 buffer instead of polishing.

---

## Sandbox-First Fallback (activated if Gate #2 fails)

**Intent:** if demo-IS-kickoff converts <25% of kickoff conversations to paid by Week 8, ship prospects into a free 14-day sandbox tenant after the demo URL click. Billing deferred to trial-end conversion.

**Lifecycle (round 3 ADV-R3-6 — explicit reach-back model, NOT silent expiry):**
- **Day 0 (sandbox provisioned):** founder gets Slack alert; auto-email to prospect with login link + per-carrier forwarding card + "I'll check in Day 3."
- **Day 3:** founder checks: did any calls land? If zero, founder calls/texts prospect: "Did the carrier forwarding work? Want me to walk through it?"
- **Day 7:** founder phone call regardless of activity. Goal: surface objections.
- **Day 12:** auto-email "trial ends in 48 hours" with payment-link CTA.
- **Day 14:** founder closing call ("ready to convert, or want to extend?").
- **Day 15 (auto-expiry):** sandbox disabled; tenant config retained 30 days; auto-email "we kept your config — here's a payment link if you want to come back."
- **Cap: 10 simultaneous sandbox tenants** (any more and founder ops collapse).

**Out of scope at MVP:** automated sandbox-to-paid conversion via Stripe Checkout (manual payment-link issuance per D13).

---

## Risks

### High

- **R-A. Retell warm-transfer reliability silent-failure mode.** Retell API can return 200 while the caller hears dead air during a bridged transfer.
  - **Mitigation:** Week 4 reliability gate measures *caller-perceived* heard-audio (not just Retell API 200), 100-call sample (not 30), with a continuous synthetic-monitor canary placing one outbound test call/hour to detect silent failures (round 1 adversarial ADV-3). If <95%, the gap is accepted into v1.1 rather than pulling SMS into MVP (per founder's no-outbound-prospecting decision).
- **R-B. Gemini 3 Flash structured-output reliability under 99% on early production calls.**
  - **Mitigation:** 50-transcript golden set in U10 (round 1 adversarial F6 — 10 transcripts was insufficient); ≥48/50 schema-valid required before Week 8 first paying logo; failures route to a manual-review queue with corrective re-prompt; founder reviews Sev-3 Sentry events daily for first 50 logos.
- **R-C. p99 < 150ms latency budget breaks under concurrent load.**
  - **Mitigation:** Concurrent-load k6 test (10 VUs) added to U7 in addition to sequential (round 1 adversarial F1); single-instance always-warm Render Web Service with pre-warmed Postgres pool; deploy-time canary holds traffic until warm-up completes (round 1 adversarial ADV-9). Document explicitly that the architecture is single-instance until 200 logos; horizontal scale requires moving tenant-config cache to Redis (round 1 ADV-10).

### Medium

- **R-D. Carrier call-forwarding setup fails for a small fraction of Austin prospects.** AT&T business landlines especially require web-portal access or 15-45 min on hold with carrier support.
  - **Mitigation:** Per-carrier instruction cards in U20 onboarding flow with research-corrected dial codes (`**67*` busy, `**61*` no-answer); founder offers screen-share for AT&T business landline customers; carrier setup target is "same-day async, within 24h" (D10 update — drops the original "live before hangup" promise).
- **R-E. Jobber partner certification gated on partner approval.** Could add 1-4 weeks. (HCP removed from this risk since HCP is now v1.1.)
  - **Mitigation:** Apply for Jobber partner access in Week 1 (built into Week 1 task list); if Jobber not granted by end of Week 4, the U14 generic webhook URL field still covers integration handoff via Zapier→Jobber as a fallback path.
- **R-F. Demo-IS-kickoff model fails when prospects can't decide on the call.**
  - **Mitigation:** GTM Validation Gate #2 (Week 8) — if 0 closes by Week 8, switch to 14-day sandbox-first model; in-person Austin-metro kickoff (D10 mode 1) reduces remote-cognitive-load risk; collaborative framing in U22 demo opening ("let's correct it together," NOT "I already built your agent") avoids over-promise (round 1 product-lens F2).
- **R-G. Pre-demo extractor confident hallucinations** — extractor commits a draft from a thin website, agent demo says wrong things confidently, kills the close (round 1 adversarial ADV-2).
  - **Mitigation:** Per-field confidence scores with below-threshold fields rendered yellow/blank (NOT auto-filled); collaborative demo opening framing; Week 6 rehearsal where founder runs extractor on 10 random Austin prospects and grades hallucination rate.
- **R-H. Multi-state warm-transfer recording-consent risk.** *Kearney v. Salomon Smith Barney* (CA Supreme Court) makes California's all-party-consent law apply when a party is in CA, regardless of TX side.
  - **Mitigation:** D11 multi-state hardening — owner declares primary state of operation; dashboard warns when escalating during travel to two-party states. Tagged Austin-specific.

### Low

- **R-I. README.md regression to old GCP stack.** Future Claude sessions re-hydrate wrong context.
  - **Mitigation:** README.md rewrite is Week 1 task; CLAUDE.md/AGENTS.md/memory all reflect canonical stack + Austin beachhead.
- **R-J. Gemini 3 Flash exits preview at GA with breaking model-ID changes.**
  - **Mitigation:** Pinned version string makes migration mechanical; ~2-hour budget per origin doc.
- **R-K. Founder-as-single-point-of-failure** during 5+ daily ops paths (Sentry review, manual SLA credits, manual Stripe billing, carrier setup, demo-IS-kickoff calls, tenant config edits) (round 1 adversarial ADV-7).
  - **Mitigation:** All currently-manual paths are explicitly listed as v1.1 automation candidates; if founder takes a break, in-person/remote kickoffs can reschedule (no SLA promise about onboarding speed in MVP).
- **R-L. Austin TAM ceiling.** ~1.5k operators × realistic 5-10% maturity share × $179 ARPU = $135k-270k ARR ceiling on Austin alone.
  - **Mitigation:** Decisions tagged `Austin-specific` should be revisited at logo 25 for portability refactor (not formalized as expansion plan in MVP per founder direction — ARR growth via per-tenant feature expansion takes priority).

---

## Operational Setup (Week 1 task list)

- [ ] Vercel project provisioned, `vercel.json` configured with the dashboard build path
- [ ] Render account: one Web Service (`services/voice`, Virginia, Starter $7/mo, autoscaling off, always-warm) + one Background Worker (`services/post-call`, Virginia, Starter) + one Cron Job (weekly ROI, Virginia)
- [ ] Supabase project in `us-east-1` (Virginia); RLS enabled by default on all tenant-scoped tables; Vault enabled for secrets
- [ ] Sentry organization with three projects (dashboard, voice, post-call); PII scrubbing rules configured
- [ ] Resend account; DKIM/SPF on production domain; first sender identity verified
- [ ] Retell account; one production agent template per scaffold (General + HVAC); outbound calling enabled (used only for owner-warm-transfer escalation, NOT for prospecting)
- [ ] Vertex AI enabled on the existing `your-gcp-project` GCP project ; service-account JSON stored in Render Environment Group + Vercel env (no other GCP services consumed — vestigial GCP project kept solely for Vertex AI access)
- [ ] Stripe account; three products created (Starter / Growth / Pro); **payment links generated on demand from Stripe dashboard at MVP** (no webhook endpoint needed; Checkout is v1.1)
- [ ] **Jobber developer signup + free sandbox + GraphiQL access** — IMMEDIATE on signup (research-confirmed 2026-05-04, no partner-approval wait for dev work)
- [ ] **Email `api-support@getjobber.com` Week 1** to start the partner-approval clock for production (needed only for ≥6 paying logos, but kicked off early to avoid blocking)
- [ ] Per-carrier conditional-forwarding instruction cards drafted in U20 with research-corrected dial codes (`**67*` busy, `**61*` no-answer for AT&T mobile / T-Mobile; web portal paths for Spectrum business + AT&T business landlines)
- [ ] Domain: `requesthandoff.com` — DNS to Vercel (apex + www), Resend DKIM/SPF, future-proofed for `app.requesthandoff.com` if dashboard splits later
- [ ] GitHub repo + branch protection (main + PR review optional for solo); CI runs `pnpm typecheck && pnpm test` on every PR
- [ ] `.env.example` files committed in each app/service with all required keys listed (no values)
- [ ] Calendar reminder set for **2026-07-01** to re-check runtime swap triggers (origin doc Deferred to Planning #8)

---

## Open Questions Deferred to Execution

These are intentionally not resolved here because the answer depends on running code — they belong in `ce-work` execution loops, not planning.

- **Q1.** Exact prompt + few-shot examples for Gemini 3 Flash lead extraction. Iterated against a corpus of 50 synthetic + 50 early production transcripts. Prompt versions are tracked in `docs/decisions/extraction-prompt-versions.md`.
- **Q2.** Voice persona pick (D12). Decision made in Week 2 via the listening test, filed in `docs/decisions/voice-persona-test-results.md`.
- **Q3.** Resend deliverability against an Austin / Travis County IP block. Validated in Week 3 with a small spam-folder test from 5 different ISPs (Gmail, Yahoo, Outlook, AT&T, Spectrum). If bounce rate >2%, switch to Postmark per D7.
- **Q4.** HVAC urgency rule wording — verbatim language from Week 3 owner interviews replaces assumed phrasing. Final wording lands in `supabase/seed/hvac.sql` (no plumbing.sql at MVP).
- **Q5.** Texas greeting wording final — D11 default ships unless an owner interview surfaces a clear preference.
- **Q6.** Retell webhook idempotency window — empirically validated against duplicate webhook deliveries; default 5 minutes unless Retell's docs prove otherwise.

---

## Traceability Matrix (Requirement → Implementation Unit)

| R-ID | Implementation unit(s) |
|---|---|
| R1 | U5, U8 |
| R2 | U8 (no Twilio) |
| R3 | U1, U3, infrastructure |
| R4 | U3, U4 |
| R5 | U2, U3, U9 |
| R6 | U9 |
| R7 | U21, U22 (per D10 update) |
| R8 | U6, U7 |
| R9 | U6 |
| R10 | U7 (escalate-now), U9 |
| R11 | U7 (escalate-now), U15 |
| R12 | U3 (retention column), U10 |
| R13 | U15 |
| R14 | U7 (escalate-now), U9 |
| R15 | U2, U10 |
| R16 | U11, U12, U14 (U13 HCP deferred to v1.1) |
| R17 | U11 |
| R18 | U12 (HCP deferred to v1.1) |
| R19 | U14 (generic webhook URL replaces native Zapier app at MVP) |
| R20 | U19, U20 |
| R21 | U19 |
| R22 | U4 |
| R23 | U9, D11 |
| R24 | Operational setup |
| R25 | U3, U24 |
| R26 | U16 |
| R27 | U24 |
| R28 | U20, U25 |
| R29 | U5 |

---

## Acceptance Examples (carried from origin doc)

| AE-ID | Implementation unit(s) | Test phase |
|---|---|---|
| AE1 | U7, U9, U10, U15 | Week 4 |
| AE2 | U7, U15 | Week 4 |
| AE3 | U7, U9 | Week 4 |
| AE4 | U11, U12, U14 | Week 5–6 (Jobber + email + webhook URL fan-out parallelism) |
| AE5 | U6, U7, U24 | Weeks 2–10 (concurrent-load test in Week 10) |

---

## Beachhead Notes

Decisions tagged below are **Austin-specific** — they should be revisited at logo 25 if expansion to a second metro is considered. Per founder direction (2026-05-04), no formal metro-2 expansion plan exists in this MVP; ARR growth via per-tenant feature expansion takes priority.

- D11 Texas greeting + multi-state warm-transfer hardening — generalize when a non-TX tenant is signed.
- R-D carrier instruction cards — re-validate dial codes if expanding to a market with different carrier mix.
- D10 mode 1 (in-person Austin-metro kickoff) — Austin-metro only. Mode 2 (remote demo-IS-kickoff) is metro-portable.
- Jobber partner API + Stripe payment links + per-vertical scaffolds (General + HVAC) — metro-portable.

---

## Recommended Next Step

`ce-work` to begin execution from Week 1's foundation tasks (U1, U3, U4, U2, U5 in parallel where dependencies allow), or `ce-doc-review` against this plan to surface blind spots before build starts.
