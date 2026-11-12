# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This directory now contains product strategy, design direction, and an early Next.js dashboard/marketing app scaffold. Read the core product docs in this order:

1. **`STRATEGY.md`** — the durable strategy anchor (problem, approach, persona, 5 metrics, 4 tracks, marketing). **This is the canonical source for positioning and tracks.** When STRATEGY.md and the PRD disagree, STRATEGY.md wins — it was written after research and reflects the sharpened wedge.
2. **`GTM-PLAYBOOK.md`** — tactical companion (Austin beachhead, $79/$179/$349 pricing, 10-competitor battlecard, sales scripts, first-100-logo plan). Expect this file to change quarterly.
3. **`docs/PRD.md`** — original PRD reference. Use as a deeper reference for FR1-FR10 spec details, vertical playbook examples, and the segments-and-personas long-form. The working name "Call Coverage" in this doc is the same product as RequestHandoff.

For design and frontend work, read:

1. **`docs/design/requesthandoff-design-system.md`** — canonical website/product visual direction.
2. **`docs/design/requesthandoff-page-patterns.md`** — page and product UI patterns for future screens.
3. **`apps/dashboard/app/design-tokens.css`** — implementation tokens for fonts, color, radius, spacing, and shadows.

The current Next.js app lives in `apps/dashboard/`. Use `pnpm --filter @requesthandoff/dashboard typecheck` and `pnpm --filter @requesthandoff/dashboard build` for verification when touching it.

## Product Context

**Product name:** RequestHandoff.com (the PRD's working name is "Call Coverage" — same product; prefer **RequestHandoff** in any new artifacts).

**One-line:** Integration-neutral handoff layer for local home-service businesses — answers calls the business can't, runs vertical-specific intake, and delivers structured leads _into the tools they already use_ (Jobber / Housecall Pro / ServiceTitan / HubSpot / Slack / email / SMS / Google Sheets) at a flat monthly price with no per-call escalation fees.

**Target buyer:** Owner-operators of US home/property service businesses, 1–10 employees, no dedicated front desk, already on a field-service tool or just email + a paper calendar. **Beachhead metro: Austin, TX.** Secondary segments (appointment-based, professional services, family/care from the PRD) come later.

**Competitive context** (locked in by research, drives many decisions): The "vertical-specific home-services AI receptionist" narrative is _already contested_ by Avoca (Kleiner Perkins, $1B valuation, 800+ home-service customers), ServiceTitan's bundled voice agent, Newo, and RealVoice. Vertical playbooks alone are no longer the wedge. The open gaps RequestHandoff claims are **(a) flat-rate trust + no escalation bill shock** and **(b) integration-neutral handoff into the customer's existing CRM/dispatch tool, not replacing it**.

## Canonical Design Direction

The selected website and product design direction is **Local Operator Premium** (Variant A from the design exploration). This is the canonical design system for RequestHandoff going forward.

- Primary feel: grounded, local, practical, warm, operationally credible.
- Primary font: Plus Jakarta Sans via `--rh-font-brand`.
- Primary palette: warm paper, pine green, clay/rust accent, muted field green, soft gold.
- Primary imagery: real HVAC / field-service / local-operator photography, not generic SaaS or AI imagery.
- Primary proof object: structured lead cards and handoff/delivery proof, not transcripts.

Use supporting modes deliberately:

- **Dispatch Console** (Variant B) is for dashboard/product surfaces: lead queues, delivery logs, escalation logs, usage, and operational tables. It uses IBM Plex Sans/Mono and dark graphite/gold styling.
- **Missed Revenue Audit** (Variant C) is for outbound campaign and audit pages: missed-call audit, weekly ROI, recovered-value sections, and direct-response CTAs. It uses Archivo/Work Sans and warm cream/rust styling.

Do not introduce a new font, palette, image style, or page composition language without updating `docs/design/requesthandoff-design-system.md` first. Future website and product features should start from `apps/dashboard/app/design-tokens.css`.

## Non-Negotiable Positioning Rules

These shape every decision (copy, UI, onboarding, pricing, sales motion). Updated post-research — the differentiation now leans on rules 4–6 more than rule 3:

1. **Do not lead with AI.** AI is the backend. The buyer-facing promise is _outcomes_: every call covered, every lead captured, delivered where you already work. Marketing copy and product UI reflect this.
2. **Not just "after-hours."** After-hours is the wedge, not the category. The product covers any moment the business can't answer — overflow, lunch, job-site hours, weekends, surges.
3. **Done-for-you onboarding.** SMB owners will not configure SaaS. Setup target is <30 min, mostly automated (extract from website + GBP, ask only missing fields). If a feature requires the owner to write scripts or design workflows, it doesn't ship in MVP.
4. **Vertical playbooks are table stakes — not the wedge.** Per-vertical qualification (plumbing leak severity, HVAC system-down urgency, roofing storm path) is the floor, not the ceiling. Generic AI receptionist behavior is the failure mode; vertical-specific behavior alone is not enough to win because Avoca/ServiceTitan/Newo already claim it.
5. **Flat-rate trust is load-bearing.** No per-call escalation fees, no per-minute traps, no bill shock. This is the explicit attack on Smith.ai's $4.25/escalation surcharge and AnswerConnect's opaque per-minute model. _Never_ introduce hidden surcharges in pricing pages or quotes.
6. **Integration-neutral handoff is the meaning of the name.** RequestHandoff _delivers leads into_ the tools the customer already uses (Jobber, Housecall Pro, ServiceTitan, HubSpot, Slack, email, SMS, Google Sheets, Zapier/Make webhook). We never require the customer to adopt our dashboard as a system of record, and we never ship a feature that pulls them off their existing CRM/dispatch tool. This is the structural differentiator vs. Avoca and ServiceTitan, both of which want to _be_ the dispatch system.
7. **Escalation rules are business-defined.** The system never invents what counts as urgent. The business approves the rules; the system follows them and logs every escalation.
8. **Structured leads, not transcripts.** The deliverable is a structured record (caller, service, urgency, location, preferred window, recommended next action, confidence flags) — transcripts are optional/secondary.

## Pricing Anchors (locked, see GTM-PLAYBOOK.md §2 for derivation)

- **Starter $79/mo** ($65 annual) — 75 calls, 1 number, business-hours email escalation (SMS in v1.1)
- **Growth $179/mo** ($149 annual) — 250 calls, 24/7, urgent live-call escalation via Retell warm transfer, CRM webhook
- **Pro $349/mo** ($289 annual) — 600 calls, integrations, priority support (multi-line in v1.1)
- **Overage $0.49/call.** No escalation fees, ever.

Per-call COGS target ~$0.15. Gross margins 74–86% across tiers.

## MVP Scope Discipline

Per `STRATEGY.md` "Not working on" + PRD §7.2 / §9, the MVP **excludes**:

- Deep integrations beyond Jobber, Housecall Pro, ServiceTitan, and Zapier
- Multi-system calendar booking, automated quoting, payments, upsell logic
- Multi-location / franchise complexity
- Languages beyond English
- Staffed 24/7 human fallback (only as a priced add-on later)
- **Replacing the customer's existing CRM, dispatch, or scheduling tool** — we hand off, we don't take over

When scoping work, default to "not in MVP" unless STRATEGY.md tracks or PRD §7.4 (FR1–FR10) explicitly include it. The MVP proves one thing: _Can we help a local home-service business capture valuable calls it would otherwise miss, and deliver them into the tool they already use?_

## Working With This Repo

- **For the full Claude + Compound Engineering workflow:** read
  `docs/operations/claude-compound-workflow.md`. It explains how to move work
  from strategy review → brainstorming → planning → implementation → review →
  handoff without drifting from RequestHandoff's positioning or MVP scope.
- **Before proposing features, copy, or architecture:** read the relevant section of `STRATEGY.md` first, then `GTM-PLAYBOOK.md` for tactical detail, then the PRD for spec depth. Cite the doc you're drawing from.
- **When the docs and the user disagree:** the user wins. Surface the conflict explicitly so the docs can be updated. STRATEGY.md should be re-run via `/compound-engineering:ce-strategy` rather than edited freehand.
- **Open questions parked for the next iteration** (see GTM-PLAYBOOK.md §6): compliance stance (TCPA, recording-consent states), failure-mode contract, agent voice/persona spec, and a real owner-interview pass to replace assumed switch-trigger language with verbatim quotes from Austin HVAC/plumbing/roofing owners.
- **Frontend verification:** for `apps/dashboard`, use `pnpm --filter @requesthandoff/dashboard typecheck` and `pnpm --filter @requesthandoff/dashboard build`. If running the dev server, use `pnpm --dir apps/dashboard exec next dev --turbo -p 3001` unless another port is needed.
