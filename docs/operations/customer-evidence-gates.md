---
title: Customer Evidence Gates
date: 2026-06-02
status: draft
parent: docs/operations/claude-compound-workflow.md
---

# Customer Evidence Gates

This document defines what evidence RequestHandoff needs before changing ICP, positioning, MVP scope, or implementation priorities. It exists to keep discovery broad while keeping the MVP narrow.

## Gate 1: Launch Wedge Validation

**Question:** Is Austin home/property services still the best first wedge?

**Minimum evidence:**

- 5 conversations with Austin-area home/property service operators.
- At least 3 operators confirm missed calls are a recurring revenue problem.
- At least 2 operators can name where a structured lead should land today: email, Jobber, Housecall Pro, ServiceTitan, Google Sheet, Slack, or webhook-backed automation.
- At least 1 operator agrees to a live demo or design-partner follow-up.

**Pass signal:** The owner can describe the cost of missed calls in their own words and accepts the handoff promise without needing a new CRM.

**Kill / rethink signal:** Owners do not see missed calls as urgent, cannot set up call forwarding, or only want full booking/dispatch replacement.

## Gate 2: Adjacent ICP Discovery

**Question:** Is there a nearby segment with easier sales or stronger pain than the current wedge?

**Candidate ICPs:**

- Primary adjacent lane: mobile/vehicle services — detailing, tint/wrap/PPF, windshield repair, mobile mechanic.
- Comparison lane: appointment-based local operators — salons, barbers, groomers, wellness studios.
- Watchlist only: restaurants, professional services, care/health/family services.

**Minimum evidence before promotion:**

- 8–10 conversations in the candidate ICP.
- 3+ operators describe missed calls as lost revenue or operational pain.
- 2+ operators have a simple handoff destination that does not require us to become their system of record.
- 1 operator is willing to test a serious demo, pay for a pilot, or act as a design partner.

**Pass signal:** The call flow is mostly intake + handoff, not booking/payment/order execution.

**Kill / defer signal:** The segment requires calendar writes, POS tickets, deposits, regulated intake, licensed advice, or guaranteed human fallback before value is real.

## Gate 3: Build-Priority Promotion

**Question:** Should discovery change what we build next?

Gate 3 can only be considered after the relevant Gate 1 or Gate 2 evidence bar is met. Promote an ICP or feature into planning only when the evidence gate is met and at least one is true:

- A paying design partner asks for it and the request preserves RequestHandoff's handoff-layer strategy.
- Discovery shows stronger conversion signal than the launch wedge.
- The feature supports multiple ICPs without expanding compliance or operational risk.
- The feature directly improves the current MVP's first-logo readiness.

Do not promote based only on founder curiosity, competitor FOMO, or “this market seems bigger.” Bigger is not better if it breaks handoff simplicity.

## Evidence Capture Template

For each interview or sales conversation, use `docs/operations/discovery-scorecard.md`. At minimum, capture:

```markdown
## Operator

- Business name:
- Vertical:
- City:
- Team size:
- Current phone setup:
- Current destination tool:

## Missed-Call Pain

- When calls are missed:
- What happens next:
- Owner quote:
- Estimated value per lead/order:

## Handoff Fit

- Where should the lead go:
- What fields matter:
- What counts as urgent:
- What should never be handled by the agent:

## Buying Signal

- Current workaround:
- Existing spend:
- Willingness to try demo:
- Willingness to pay:

## Notes

- Compliance/safety concerns:
- Setup blockers:
- Follow-up:
```

## Decision Rule

Keep the implementation plan focused on the current MVP until evidence says otherwise. Broaden interviews freely; broaden product scope slowly.
