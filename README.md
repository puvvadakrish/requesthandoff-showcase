# RequestHandoff

> **About this repo.** A public snapshot of RequestHandoff, which I build on my own time with Claude Code as my pair. The working repo stays private. Prospect research and outreach lists are left out, and personal contact details are replaced. `pnpm install && pnpm build && pnpm test` runs 137 tests across the dashboard, voice, and post-call services.

Integration-neutral handoff layer for small local businesses. Covers calls the business can't answer, runs vertical-specific intake, and delivers structured leads into the tools the business already uses (Jobber / generic webhook URL / email) at a flat monthly price with no per-call escalation fees.

**Beachhead:** Austin metro, TX.
**MVP verticals:** General Local Business + HVAC (plumbing v1.1).

---

## Documentation

Read in this order:

1. **[`STRATEGY.md`](./STRATEGY.md)** — durable strategy anchor (problem, approach, persona, 5 metrics, 4 tracks). Canonical source for positioning when STRATEGY and PRD disagree.
2. **[`GTM-PLAYBOOK.md`](./GTM-PLAYBOOK.md)** — tactical companion (Austin beachhead, $79/$179/$349 pricing, 10-competitor battlecard, sales scripts).
3. **[`docs/brainstorms/requesthandoff-design-requirements.md`](./docs/brainstorms/requesthandoff-design-requirements.md)** — technical design requirements (29 R-IDs, 5 acceptance examples, 4 key flows).
4. **[`docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md`](./docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md)** — implementation plan (876 lines, 25 implementation units, week-by-week sequencing).
5. **[`docs/PRD.md`](./docs/PRD.md)** — long-form FR1–FR10 spec details.

---

## Stack

| Layer                | Choice                                                              | Why                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Voice runtime**    | Retell AI                                                           | Purpose-built for inbound business agents; ~$0.07–$0.13/min; collapses 6-8 weeks of plumbing into a config                               |
| **Dashboard**        | Vercel + Next.js 15 (App Router)                                    | Edge runtime for marketing, RSC for lead-list latency, Supabase Auth helpers ship native                                                 |
| **Hot-path service** | Render Web Service (Virginia) + Hono                                | Always-warm, sub-10ms intra-region RTT to Supabase, p99 < 150ms achievable                                                               |
| **Post-call worker** | Render Background Worker (Virginia)                                 | Latency-tolerant; in-process delivery fan-out                                                                                            |
| **Database**         | Supabase Postgres (us-east-1, Virginia)                             | Same-region as Render; Vault for PII; RLS as default tenant isolation                                                                    |
| **Auth**             | Supabase Auth (email magic-link)                                    | RLS-native via `auth.uid()` JWT claim                                                                                                    |
| **Post-call LLM**    | Vertex AI Gemini 3 Flash (`gemini-3-flash-preview`, version pinned) | Latest Gemini 3 Flash with structured output + function calling in one call; ~$0.00110/summary; context caching for ~90% prefix discount |
| **Email**            | Resend                                                              | Better DX than Postmark; comparable deliverability at MVP scale                                                                          |
| **Build**            | pnpm + Turborepo monorepo, TypeScript 5.6, Node 20 LTS              | Vercel-native pattern                                                                                                                    |

**Total infra cost:** ~$0–25/mo build phase; ~$50–100/mo at 50 paying logos (excluding Retell minutes).

---

## Repository Layout

```
requesthandoff/
├── apps/
│   └── dashboard/                      # Next.js 15 on Vercel
├── services/
│   ├── voice/                          # Render Web Service (always-warm)
│   └── post-call/                      # Render Background Worker
├── packages/
│   ├── schema/                         # zod schemas + TS types (single source of truth)
│   ├── supabase-client-rls/            # anon / authenticated user JWT (RLS-enforced)
│   └── supabase-client-service/        # service-role (RLS bypass) — admin + services only
├── supabase/
│   ├── migrations/                     # 0000_init.sql (initial schema)
│   ├── policies/                       # RLS policies (tenants/users/calls/leads/...)
│   └── seed/                           # general.sql + hvac.sql vertical scaffolds
├── docs/
│   ├── plans/                          # Implementation plans (active + completed)
│   ├── brainstorms/                    # Design requirements
│   ├── decisions/                      # ADRs (voice persona, prompt versions, H1 lock)
│   ├── case-studies/                   # Named-operator artifacts captured per first-10 logos
│   └── PRD.md
├── scripts/                            # Operational scripts (extractor CLI, k6 load test)
└── STRATEGY.md, GTM-PLAYBOOK.md, CLAUDE.md, AGENTS.md (root)
```

The service-role import boundary (ESLint `no-restricted-imports`) enforces that `@requesthandoff/supabase-client-service` is allowed only in `services/*` and `apps/dashboard/app/(admin)/*`. A dashboard owner-route copy-pasting a service-role import would silently bypass RLS — the boundary catches it at lint time.

---

## Local Development

### Prerequisites

- Node 20 LTS (`nvm use 20`)
- pnpm 9 (`corepack enable && corepack use pnpm@9`)
- Supabase CLI (for local Postgres + RLS testing): `brew install supabase/tap/supabase`

### Setup

```bash
git clone git@github.com:<owner>/requesthandoff.git
cd requesthandoff
pnpm install
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp services/voice/.env.example services/voice/.env
cp services/post-call/.env.example services/post-call/.env
# Fill in real values (see Account Provisioning below)
```

For local end-to-end webhook testing, set the same `POST_CALL_WEBHOOK_SECRET` in
`services/voice/.env` and `services/post-call/.env`, then point
`services/voice/.env` `POST_CALL_WORKER_URL` at the post-call worker URL
(`http://localhost:8081` by default).

### Common commands

> **zsh note:** by default zsh treats `#` as a literal character on the command line (bash treats it as a comment). The commands below are written without inline comments so copy-paste works in either shell. If you want zsh to honor `#` comments interactively, run `setopt interactive_comments` once.

All workspaces:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm dev
```

Filter to one workspace:

```bash
pnpm --filter @requesthandoff/dashboard dev
pnpm --filter @requesthandoff/voice dev
pnpm --filter @requesthandoff/schema test
```

Local cross-service fixture:

```bash
pnpm fixture:call-ended
```

This sends a signed Retell `call_ended` payload through the voice webhook,
forwards it to a local post-call worker app, and prints the resulting in-memory
call, lead, delivery, and telemetry records.

Supabase-backed fixture:

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=<local service-role key> \
pnpm fixture:call-ended:supabase
```

This refuses to run against a non-local Supabase URL. It bootstraps a fixture
tenant/agent mapping, writes real `calls`, `leads`, and `deliveries` rows, then
cleans them up unless the script is run directly with `--keep`.

Supabase (requires local CLI install + Docker):

```bash
supabase start
supabase migration up
supabase db reset
```

---

## Account Provisioning Checklist (Week 1)

Each item below requires the founder's action. Listed in roughly the order they unblock other work.

- [ ] **GitHub repo + branch protection** on `main` (PR review optional for solo)
- [ ] **Vercel** project created; domain (`requesthandoff.com`) connected
- [ ] **Supabase** project in `us-east-1` (Virginia); Vault enabled; copy URL + anon key + service-role key
- [ ] **Render** account: one Web Service (`services/voice`, Virginia, Starter $7/mo, autoscaling off, always-warm) + one Background Worker (`services/post-call`, Virginia, Starter) + one Cron Job (Virginia)
- [ ] **Sentry** organization with three projects (dashboard, voice, post-call); PII scrubbing rules configured
- [ ] **Resend** account; DKIM/SPF set on `requesthandoff.com`
- [ ] **Retell** account; production agent template per scaffold (General + HVAC) + a SEPARATE `demo` agent for `/demo/*` URLs (per plan U22 abuse protection)
- [ ] **Vertex AI** enabled on your GCP project; service-account JSON for Render + Vercel envs
- [ ] **Stripe** account; three products created (Starter / Growth / Pro). At MVP: payment links generated on demand from the Stripe dashboard. Self-serve Checkout is v1.1.
- [ ] **Cloudflare Turnstile** site key + secret for `/demo/<id>/connect` CAPTCHA (plan U22 abuse protection)
- [ ] **Jobber** developer signup + free GraphiQL sandbox — IMMEDIATE on signup (no partner approval needed for dev work). Email `api-support@getjobber.com` in Week 1 to start the partner-approval clock for production (needed for ≥6 paying logos).

---

## Plan Status (2026-05-04)

The MVP implementation plan at [`docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md`](./docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md) is the source of truth. Three rounds of `ce-doc-review` produced ~80 findings; safe-auto fixes applied silently, 14 strategic decisions resolved with the founder, 1 punted to post-MVP.

**Current branch:** `feat/mvp-week-1-foundation`

**Week 1 foundation deliverables (this branch):**

- ✅ Monorepo scaffolding (pnpm + Turborepo + TypeScript)
- ✅ `packages/schema` zod schemas + TS types + Vitest tests
- ✅ Supabase migration `0000_init.sql` with all tables, indexes, triggers, RLS enabled
- ✅ Supabase seed scaffolds (`general.sql` with Life-Safety Baseline + `hvac.sql` extending General)
- ✅ Supabase RLS policies (`_helpers.sql` + per-table policies)
- ✅ `packages/supabase-client-rls` + `packages/supabase-client-service` with documented import boundary
- ✅ ESLint `no-restricted-imports` rule enforcing the service-role boundary
- ✅ VoiceRuntime seam (single file in `services/voice/src/runtime/retell.ts`)
- ✅ App + service skeletons (Hono servers stubbed, `.env.example` files, package.json + tsconfig.json per workspace)
- ✅ CI baseline (`.github/workflows/ci.yml`)

**Weeks 2-12** require account provisioning (above), real owner interviews, real test calls, and code-against-real-services execution. Each week's deliverables are in the implementation plan.

---

## Non-Negotiable Positioning Rules (mirror `CLAUDE.md`)

1. Do not lead with AI. AI is the backend; outcomes are the promise.
2. Not just "after-hours." Any moment the business can't answer.
3. Done-for-you onboarding. SMB owners don't configure SaaS.
4. Vertical playbooks are table stakes — not the wedge.
5. Flat-rate trust is load-bearing. No escalation fees, ever.
6. Integration-neutral handoff is the meaning of the name. We deliver into the tools they already use; we don't replace them.
7. Escalation rules are business-defined. The system never invents urgency.
8. Structured leads, not transcripts. Transcripts are secondary.

---

## License

UNLICENSED — internal product, not open-source.
