---
title: "feat: No-Interview Mobile Vehicle Demo Outreach"
type: feat
status: active
date: 2026-06-02
origin: docs/discovery/2026-06-first-batch/desk-research-readout.md
---

> Note: files under `docs/discovery/` hold prospect research and live in a private repo. They are not part of this public copy.

# feat: No-Interview Mobile Vehicle Demo Outreach

## Summary

Run a reversible, low-cost no-interview demo/outreach experiment for Austin-area mobile/vehicle service businesses: mobile detailers, tint/wrap/PPF shops, auto glass, and mobile mechanics. This plan uses public website/GBP evidence to build personalized demo hypotheses and outreach copy, then measures engagement before any first-logo setup or implementation scope change.

This does **not** change RequestHandoff's launch wedge. Home/property services remain the strategy-backed launch wedge. Mobile/vehicle is the first adjacent desk-research experiment because its public call flows appear structured, owner-led, quote-heavy, and less likely to demand CRM/dispatch replacement.

## Origin

- Desk research readout: `docs/discovery/2026-06-first-batch/desk-research-readout.md`
- ICP portfolio: `docs/brainstorms/2026-06-02-icp-portfolio-brainstorm.md`
- Demo playbook: `docs/operations/demo-to-first-logo-playbook.md`
- Discovery tracker: `docs/discovery/2026-06-first-batch/prospect-tracker.md`

## Goals

- Test whether mobile/vehicle prospects engage with personalized demo links without prior interviews.
- Learn whether public-page evidence is enough to create a credible RequestHandoff demo.
- Measure interest using behavior: demo link click, demo session start, reply, kickoff request, trial/payment interest.
- Avoid expanding MVP scope until a prospect actively engages and passes safety gates.

## Non-Goals

- No strategy rewrite from desk research alone.
- No production forwarding from cold outreach alone.
- No calendar booking, calendar write-back, deposit collection, POS write-back, quoting automation, SMS, or outbound AI calls.
- No claims that RequestHandoff has validated missed-call pain for these prospects.
- No replacing the customer's CRM, scheduler, dispatch system, booking tool, or POS.

## Target Segment

Primary experiment lane:

- Mobile detailing.
- Tint/wrap/PPF/ceramic shops.
- Mobile windshield / auto glass repair.
- Mobile mechanic.

Initial prospect pool lives in `docs/discovery/2026-06-first-batch/prospect-tracker.md` and `docs/discovery/2026-06-first-batch/prospects.csv`.

## Experiment Gates

### Gate A — Prospect Qualification

A prospect is eligible for no-interview demo creation when public pages show at least 4 of 6:

- Phone/text-first CTA.
- Mobile/on-site service or small shop workflow.
- Quote-heavy or package-based services.
- High-ticket or urgent category.
- No obvious 24/7 staffed answering claim.
- No obvious requirement for booking/POS write-back to understand the value.

### Gate B — Demo Engagement

Continue outreach if, across the first 8 personalized demo sends:

- At least 2 prospects click the demo link.
- At least 1 prospect starts the demo session.
- At least 1 prospect replies with correction, interest, or kickoff request.

If there are clicks but no replies, revise copy. If there are no clicks, revise targeting and subject line before building more demos. Do not expand to 20 sends until the first 8 have at least one meaningful engagement signal.

### Gate C — Kickoff / Pilot Eligibility

A prospect can move to the demo-to-first-logo playbook only when:

- They reply or request a call.
- They confirm RequestHandoff captures and hands off requests; it does not book jobs.
- They have a simple handoff destination.
- They have no scorecard disqualifier.
- For mobile mechanic / auto glass prospects, they understand RequestHandoff only collects intake and never gives roadworthiness advice, diagnostics, legal/safety claims, or repair recommendations.
- Founder can monitor the first 48 hours if a pilot begins.

## Implementation Units

### U1. Rank Mobile / Vehicle Prospects

**Files:**

- `docs/discovery/2026-06-first-batch/prospect-tracker.md`
- `docs/discovery/2026-06-first-batch/prospects.csv`

**Work:**

- Add a desk-research priority marker for MV-01 through MV-12.
- Score each prospect 0–12 using the desk-research proxy dimensions: urgency, phone-first, owner-led, job value, handoff simplicity, existing coverage risk.
- Select the first 8 prospects for demo/outreach.

**Acceptance Criteria:**

- Each selected mobile/vehicle prospect has a priority score or rank.
- Any prospect with obvious calendar/POS/write-back dependency is marked `defer` or backup.

### U2. Create Public-Page Demo Briefs

**Files:**

- `docs/discovery/2026-06-first-batch/artifacts/mobile-vehicle-demo-briefs.md`

**Work:**

- Create one brief per selected prospect.
- Capture public facts only: services, service area, hours if visible, CTA style, likely intake fields, likely urgency triggers, handoff hypothesis, and recording-disclosure wording for the demo greeting.
- Include correction-needed fields instead of inventing missing facts.

**Acceptance Criteria:**

- 8 demo briefs exist.
- Each brief labels direct evidence vs inference.
- Each demo greeting includes recording disclosure.
- No private PII or scraped non-public data is stored.

### U3. Draft Outreach Copy

**Files:**

- `docs/discovery/2026-06-first-batch/artifacts/mobile-vehicle-outreach-copy.md`

**Work:**

- Draft 3 cold email variants and 2 short follow-up variants.
- Add cold-email guardrails: manual founder-sent only, no automated sequences, no outbound AI calls, no scraped personal emails unless publicly business-listed, and a plain opt-out line.
- Lead with covered calls + structured handoff, not AI.
- Include a correction-friendly line: “I built this from your public website, so tell me what it gets wrong.”
- Mention flat-rate/no escalation fees only as trust proof, not a hard sell.

**Acceptance Criteria:**

- Copy avoids AI-led positioning.
- Copy includes manual-send and opt-out guardrails.
- Copy does not promise booking, quotes, payments, SMS, or CRM replacement.
- Copy asks for one action: listen, correct, or request kickoff.

### U4. Define Demo Metrics Tracker

**Files:**

- `docs/discovery/2026-06-first-batch/artifacts/mobile-vehicle-demo-metrics.md`

**Work:**

- Create a lightweight table to track prospect, send date, demo link, click, session start, reply, correction, kickoff request, and next action.
- Include Gate B decision rules.

**Acceptance Criteria:**

- Metrics can support go/no-go without external tooling.
- No metric implies product validation before replies/kickoff.

### U5. Update Synthesis After Outreach

**Files:**

- `docs/discovery/2026-06-first-batch/synthesis/week-01.md`
- `docs/discovery/2026-06-first-batch/final-readout.md`

**Work:**

- Add a no-interview outreach results section.
- Keep interview gates marked as not passed unless real interviews happen.
- Decide whether to continue outreach, revise copy, run mobile/vehicle `ce-brainstorm`, or return to first-logo home/property readiness.

**Acceptance Criteria:**

- Final readout separates desk research, outreach engagement, and actual owner validation.
- No `STRATEGY.md` update is recommended unless founder approves.

## Verification

- `pnpm exec prettier --check "docs/discovery/2026-06-first-batch/**/*.md" "docs/plans/2026-06-02-no-interview-mobile-vehicle-demo-outreach-plan.md"`
- Manual review against:
  - `docs/operations/compliance-stance.md`
  - `docs/operations/failure-mode-contract.md`
  - `docs/operations/demo-to-first-logo-playbook.md`
  - `docs/operations/customer-evidence-gates.md`

## Risks

- Desk research can overstate pain; public pages do not show missed-call rate.
- Demo links may create curiosity but not buying intent.
- Mobile/vehicle prospects may still require calendar booking or SMS to see value.
- Personalized demos can consume founder time before demand is proven.
- A prospect may assume RequestHandoff books jobs unless copy is explicit.

## Next Step

Run `ce-work` on this plan only after the founder confirms this no-interview experiment should proceed.
