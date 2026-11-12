---
title: Discovery Scorecard
date: 2026-06-02
status: draft
parent: docs/operations/customer-evidence-gates.md
---

# Discovery Scorecard

Use this scorecard after every owner interview, demo conversation, or discovery call. The goal is to make ICP evidence comparable across Austin home/property services, mobile/vehicle services, and appointment-based local operators.

## How To Use

1. Run the conversation using `docs/operations/owner-interview-script.md`.
2. Fill one scorecard per operator.
3. Score each section from 1–5.
4. Save exact owner language, especially around missed calls and willingness to pay.
5. Compare weekly totals against `docs/operations/customer-evidence-gates.md`.

Do not promote an ICP or feature into planning from one exciting conversation. Patterns beat anecdotes.

## Operator Profile

```markdown
## Operator

- Date:
- Interviewer:
- Business name:
- Website / GBP:
- City / service area:
- Segment:
  - [ ] Home/property service
  - [ ] Mobile/vehicle service
  - [ ] Appointment-based local operator
  - [ ] Watchlist segment
- Vertical:
- Team size:
- Owner-operated with 1–10 employees:
- Austin metro fit:
- Owner/operator involved in calls:
- Current phone setup:
- Current destination tool:
- Existing monthly spend on answering/scheduling/call tools:
```

## Evidence Capture

```markdown
## Missed-Call Pain

- When calls are missed:
- What happens next:
- Estimated missed calls per week:
- Owner quote:
- Score (1–5):

## Lead / Job Value

- Typical job/order/appointment value:
- Repeat/LTV potential:
- One captured call justifies monthly fee?
- Score (1–5):

## Handoff Fit

- Where should the summary go:
- Required fields:
- Urgency/routing rules:
- What can wait for callback:
- What must never be handled:
- Requires calendar/POS/payment/write-back?
- Score (1–5):

## Setup Feasibility

- Call forwarding comfort:
- Website/GBP has enough info for demo:
- Existing tools are accessible:
- Biggest setup blocker:
- Score (1–5):

## Buying Signal

- Wants demo:
- Would try bounded pilot:
- Willingness to pay:
- Reaction to flat-rate / no escalation fees:
- Timeline:
- Main objection:
- Score (1–5):
```

## Scoring Rubric

| Score | Meaning                                                                       |
| ----- | ----------------------------------------------------------------------------- |
| 1     | No real pain, unclear destination, no buying signal                           |
| 2     | Some pain, but product would need major non-MVP scope                         |
| 3     | Real pain and handoff fit, but weak urgency or uncertain willingness to pay   |
| 4     | Strong pain, clear handoff, wants demo or pilot                               |
| 5     | Strong pain, clear handoff, high-value calls, urgent timeline, willing to pay |

## Section Score Anchors

Use these anchors to make scores comparable across interviewers.

### Missed-Call Pain

| Score | Anchor                                                                             |
| ----- | ---------------------------------------------------------------------------------- |
| 1     | Rarely misses calls or does not care when calls go unanswered                      |
| 2     | Misses calls occasionally, but sees them as administrative noise                   |
| 3     | Misses calls weekly and believes some become lost opportunities                    |
| 4     | Missed calls are a recurring owner frustration with clear lost-revenue stories     |
| 5     | Missed calls are urgent, frequent, and already causing measurable lost jobs/orders |

### Lead / Job Value

| Score | Anchor                                                                             |
| ----- | ---------------------------------------------------------------------------------- |
| 1     | One captured call is low value and cannot justify the monthly fee                  |
| 2     | Value is modest; ROI requires high call volume                                     |
| 3     | A few captured calls per month could justify Starter/Growth pricing                |
| 4     | One or two captured jobs can justify the monthly fee                               |
| 5     | One captured job/order can repay multiple months or creates strong recurring value |

### Handoff Fit

| Score | Anchor                                                                                   |
| ----- | ---------------------------------------------------------------------------------------- |
| 1     | No clear destination or owner needs full booking/order execution                         |
| 2     | Handoff destination exists, but useful value depends on non-MVP write-back               |
| 3     | Lead/request summary helps, but several fields or rules are unclear                      |
| 4     | Clear destination, concrete fields, and simple urgency/routing rules                     |
| 5     | Structured handoff maps cleanly to current workflow with no system-of-record replacement |

### Setup Feasibility

| Score | Anchor                                                                        |
| ----- | ----------------------------------------------------------------------------- |
| 1     | Phone setup is unknown or cannot be safely tested                             |
| 2     | Setup likely needs custom carrier/tool work before a demo                     |
| 3     | Setup is plausible, but call forwarding or source data needs founder help     |
| 4     | Demo can be built from website/GBP and forwarding path is testable            |
| 5     | Setup is straightforward, rollback is clear, and owner is comfortable testing |

### Buying Signal

| Score | Anchor                                                                    |
| ----- | ------------------------------------------------------------------------- |
| 1     | No interest, no budget, or rejects automated call coverage                |
| 2     | Mild curiosity but no demo/pilot intent                                   |
| 3     | Wants to see demo; willingness to pay is uncertain                        |
| 4     | Wants bounded pilot and accepts flat-rate/no-escalation-fee value         |
| 5     | Urgent buyer or design partner; flat-rate trust is a clear differentiator |

## Segment Fit Score

Add the five section scores:

| Total | Interpretation                              |
| ----- | ------------------------------------------- |
| 5–10  | Poor fit; do not pursue                     |
| 11–15 | Weak fit; only keep as market context       |
| 16–20 | Plausible fit; needs more interviews        |
| 21–23 | Strong fit; prioritize demo/pilot follow-up |
| 24–25 | Design-partner candidate                    |

## Disqualifiers

Mark the operator as **defer / no-build** if any of these are true:

- Requires calendar booking or rescheduling to be useful.
- Requires POS/kitchen ticket/order write-back.
- Requires deposit/payment collection.
- Requires regulated intake, licensed advice, PHI handling, legal privilege, or care/safety claims.
- Wants RequestHandoff to replace their CRM, dispatcher, scheduler, or system of record.
- Cannot identify where a lead summary should land.
- Cannot safely test call forwarding or a pilot number.

## ICP Promotion Gates

### Launch Wedge: Home / Property Services

Proceed toward first-logo planning when:

- 5 interviews completed.
- Operators match the launch wedge: Austin-area, owner-operated, 1–10 employees, home/property service.
- 3+ operators confirm missed calls as recurring revenue pain.
- 2+ operators name a simple handoff destination.
- 2+ operators score 21+ with no disqualifier.
- 1+ operator agrees to demo or pilot.

### Adjacent ICP: Mobile / Vehicle Services

Promote into a planned experiment only when:

- 8–10 interviews completed.
- 3+ operators confirm missed calls as lost revenue.
- 2+ operators have simple handoff destinations.
- 3+ operators score 21+ with no disqualifier.
- 1+ operator is a serious design partner or paid pilot candidate.
- No core value depends on calendar writes, deposits, POS, regulated intake, or system-of-record replacement.

### Comparison Lane Only: Appointment-Based Operators

Keep as comparison research. Do not promote into pilot or implementation planning from this scorecard alone because this segment can pull RequestHandoff into calendar booking/rescheduling scope.

Use the lane to learn:

- Whether lead/request handoff is valuable without calendar write-back.
- Whether operators prefer call coverage and message capture over booking automation.
- Which scheduling requirements would break MVP scope.

Promotion requires a separate founder-approved brainstorm and strategy update.

## Weekly Synthesis Template

```markdown
# Discovery Synthesis — Week of YYYY-MM-DD

## Conversations Completed

- Home/property:
- Mobile/vehicle:
- Appointment-based:
- Watchlist:

## Strongest Quotes

- Quote:
- Quote:
- Quote:

## Score Summary

| Segment           | Interviews | Avg score | Strong leads | Design partners | Disqualifiers | High-score disqualified |
| ----------------- | ---------: | --------: | -----------: | --------------: | ------------: | ----------------------: |
| Home/property     |            |           |              |                 |               |                         |
| Mobile/vehicle    |            |           |              |                 |               |                         |
| Appointment-based |            |           |              |                 |               |                         |

## Pattern Read

- Missed-call pain:
- Handoff destinations:
- Setup blockers:
- Willingness to pay:
- Scope risks:

## Decision

- [ ] Continue current discovery mix
- [ ] Increase home/property outreach
- [ ] Increase mobile/vehicle outreach
- [ ] Park appointment-based operators
- [ ] Promote a specific ICP or feature into `ce-plan`

## Rationale

- Evidence:
- Risks:
- Next interviews:
```

## Decision Rule

Discovery should broaden learning, not MVP scope. If evidence supports a change to ICP, positioning, or build priority, capture it in a brainstorm first, then ask the founder before running `ce-plan`.
