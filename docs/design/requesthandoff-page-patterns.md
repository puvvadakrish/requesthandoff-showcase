---
status: active
created: 2026-05-04
parent: requesthandoff-design-system.md
---

# RequestHandoff Page Patterns

Use this document when creating new website pages or product surfaces. The canonical design direction is Local Operator Premium, with Dispatch Console and Missed Revenue Audit used only as supporting modes.

## Pattern Map

| Context | Use Direction | Notes |
|---|---|---|
| Main homepage | Local Operator Premium | Warm, local, trust-led, image-led |
| Vertical pages | Local Operator Premium + focused trade imagery | HVAC, plumbing, roofing later |
| Pricing page | Local Operator Premium | Flat-rate trust must be the spine |
| Missed-call audit page | Missed Revenue Audit | Strong direct-response framing |
| Demo-from-website page | Local Operator Premium + product proof | Should feel easy and done-for-you |
| Owner dashboard | Dispatch Console | Dense, scannable, operational |
| Lead detail page | Dispatch Console + lead-card proof | Structured record is the center |
| Escalation log | Dispatch Console | Table/list first, no decorative cards |
| Weekly ROI report | Missed Revenue Audit + product proof | Revenue proof without hype |

## Homepage Pattern

The homepage should prove four ideas quickly:

1. Every call gets covered.
2. Leads are structured and handed off.
3. Pricing is flat and trustworthy.
4. The business keeps its existing tools.

Recommended section order:

1. Hero with local service imagery and captured-lead proof object.
2. Trust strip: no escalation fees, local/Austin, current tools.
3. Missed-call problem with organic stats.
4. Handoff flow: answer, qualify, deliver.
5. Integration-neutral proof.
6. Vertical urgency proof.
7. Flat-rate pricing.
8. Demo-from-website CTA.

Borrow from Variant C when strengthening conversion:

- Add "missed revenue" framing after the hero.
- Use weekly recovered-value proof in the middle or near the CTA.
- Keep the tone concrete, not alarmist.

Borrow from Variant B when strengthening product credibility:

- Add a compact delivery log.
- Show timestamps, destinations, and outcomes.
- Keep console elements small and purposeful.

## Missed-Call Audit Page Pattern

Use for `/missed-call-audit` or outbound campaigns.

Primary job: get a skeptical owner to request a website-based demo or audit.

Structure:

1. Direct hero: "Find the calls that should have become jobs."
2. Three-stat economics band.
3. Example weekly ROI report.
4. How the demo/audit works.
5. Flat-rate trust section.
6. CTA to start from website/GBP.

Visual style:

- Use `--rh-font-audit-display` for large revenue/audit headlines.
- Use warm cream and rust.
- Use real field/operator imagery.
- Use big numbers, but keep the claims sourced from `GTM-PLAYBOOK.md`.

Do not use this style for the whole product. It is a conversion mode.

## Dashboard Pattern

Use Dispatch Console patterns for owner-facing dashboard screens.

Dashboard principles:

- Dense, scannable, calm.
- Tables and lists before decorative cards.
- Use monospace for timestamps, counts, usage, and delivery status.
- Surface proof of handoff: destination, time, outcome, retry state.
- Treat the dashboard as a receipt/archive, not the system of record.

Core screens:

- Lead list.
- Lead detail.
- Escalation log.
- Delivery log.
- Plan usage.
- Weekly ROI archive.

Lead list recommended columns:

- Time.
- Caller.
- Service issue.
- Urgency.
- Handoff destination.
- Status.

Lead detail recommended sections:

- Structured lead summary.
- Call transcript as secondary.
- Escalation attempts.
- Delivery attempts.
- Owner outcome marking.

## Demo-From-Website Pattern

Use for shareable demo routes like `/demo/[id]`.

Primary job: make the owner feel "they already built this for my business."

Structure:

1. Business name and extracted profile status.
2. Agent preview / call button.
3. Extracted services, hours, service area, and urgency rules.
4. Confidence flags for fields needing approval.
5. Captured sample lead after the demo call.

Visual style:

- Local Operator Premium base.
- Use lead-card proof objects.
- Use subtle confidence states, not loud warnings.
- Avoid making the owner configure workflows from scratch.

## Vertical Page Pattern

Use for `/hvac`, `/plumbing`, `/roofing` later.

Primary job: show the product understands the vertical without making vertical playbooks the whole wedge.

Structure:

1. Trade-specific hero and issue example.
2. Missed-call/job-size framing.
3. Vertical urgency rules.
4. Handoff destinations.
5. Flat-rate trust.
6. Demo CTA.

Rules:

- Do not claim unsupported verticals are live.
- If a vertical is not MVP-ready, present it as "coming next" or omit it.
- Keep integration-neutral and flat-rate proof above vertical depth.

## Pricing Page Pattern

Primary job: make price feel predictable and low-risk.

Must include:

- Starter, Growth, Pro.
- Included calls.
- Annual price if shown.
- Overage at `$0.49/call`.
- "No escalation fees, ever."
- "No per-minute billing."
- "No CRM lock-in."

Avoid:

- Hidden surcharges.
- "Contact sales" as the only route.
- Enterprise-style packaging for the initial SMB buyer.

## Copy Rules

Good copy:

- "Every call covered. Every lead captured."
- "Delivered where you already work."
- "No escalation fees, ever."
- "We hand off. We do not take over."
- "Hear your own business answer before you switch anything."

Avoid:

- "AI-powered receptionist" as the primary headline.
- "Seamless," "next-gen," "revolutionary," or "autonomous workforce."
- Claims that imply automated booking, quoting, payment, or CRM replacement.

## Implementation Rules

- Start from `apps/dashboard/app/design-tokens.css`.
- Keep shared primitives in global CSS until a component system exists.
- Do not add a UI library solely for marketing pages.
- Do not introduce new fonts or palettes without updating `requesthandoff-design-system.md`.
- Preserve the `/design/option-b` and `/design/option-c` routes until the design system is fully applied to the real homepage and at least one product page.
