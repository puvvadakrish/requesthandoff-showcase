---
title: Owner Interview Script
date: 2026-06-02
status: draft
parent: docs/operations/customer-evidence-gates.md
---

# Owner Interview Script

Use this script to validate RequestHandoff's launch wedge and compare the strongest adjacent ICPs without widening MVP scope. The goal is to collect real owner language, current workflow facts, and buying signals — not to pitch the product for 30 minutes.

## Interview Goal

Answer four questions:

1. Do missed calls create visible revenue or operational pain?
2. Where should a structured lead/order/request land today?
3. Does the owner want handoff coverage, or do they actually need booking/order execution?
4. Is the segment simple enough to support without replacing the owner's existing tools?

## Recommended Discovery Mix

Run this as a two-week sprint:

- 5 Austin home/property service operators.
- 3 mobile/vehicle service operators.
- 3 appointment-based local operators.
- Optional: 2 restaurant/professional-service calls only as watchlist learning, not MVP input.

Recommended first adjacent ICP: **mobile/vehicle service shops**. Appointment businesses have cleaner scheduling flows, but mobile/vehicle services better preserve RequestHandoff's handoff-layer thesis and avoid turning the product into calendar software too early.

## Opening

> I'm talking with local owner-operators about what happens when calls hit while you're with a customer, on a job, or closed. I'm not trying to sell you software on this call. I'm trying to understand where the phone leaks money and what a useful handoff would look like.

## Warm-Up

- What kind of work do you do, and what area do you serve?
- How many people are on the team?
- Who normally answers the phone?
- What happens when nobody can answer?
- What tools do you already use for jobs, scheduling, or follow-up?

## Missed-Call Pain

- When are you most likely to miss calls?
- Do callers usually leave voicemails, text, or call the next business?
- Can you remember a missed call that probably cost you real money?
- Roughly what is a normal job/order/appointment worth?
- How many calls do you think you miss in a normal week?
- What do you do today to catch up on missed calls?

## Handoff Fit

- If someone else answered for you, what information would you need in the summary?
- Where should that summary go so you actually see it?
- What information is annoying when it is missing?
- What kinds of calls should be marked urgent?
- What kinds of calls should never be handled by an automated receptionist?
- Would a clean lead summary be enough, or would it need to book/write into your calendar to be useful?

## Call-Forwarding / Phone Plumbing

- What phone setup do you use today: cell phone, landline, VoIP, Google Voice, call tracking number, or field-service number?
- Have you ever set up call forwarding?
- Would you be comfortable forwarding only after-hours or only when unanswered?
- What would make call forwarding feel risky?
- If it went badly, how would you want to turn it off quickly?

## Existing Spend / Buying Signal

- Do you pay for a receptionist, answering service, missed-call text-back, call tracking, CRM, or scheduling tool today?
- What does that cost?
- What would make a flat monthly price feel obviously worth it?
- Which price would feel like a no-brainer if it worked: $79, $179, or $349/month?
- Would you listen to a demo built from your website?
- Would you try it for a bounded pilot if the first week were closely monitored?

## Segment-Specific Questions

### Home / Property Services

- Which calls are emergencies versus normal callbacks?
- What service areas or ZIP codes matter?
- What jobs do you not take?
- Do you use Jobber, Housecall Pro, ServiceTitan, email, paper calendar, or something else?
- What exact words do customers use when the issue is urgent?

### Mobile / Vehicle Services

- What vehicle details matter before you can respond: year, make, model, location, service type, photos?
- Which calls need quote range versus callback?
- Do you work by appointment window, route, shop bay, or first-come-first-served?
- Where do inquiries come from today: Google, Instagram, Facebook, repeat customers, referrals?
- What destination would be easiest: text, email, calendar notification/request capture, spreadsheet, CRM, or webhook automation? At MVP, calendar means handoff/notification only — not writing or rescheduling appointments.

### Appointment-Based Local Operators

- Which calls are booking, rescheduling, cancellation, pricing, or policy questions?
- Do customers ask for a specific provider?
- What booking system do you use?
- Would a lead/request summary help, or does the call need to actually change the calendar?
- What cancellation/deposit rules would an answering system need to know?

### Watchlist: Restaurants / Takeout

- Are phone calls mostly orders, reservations, catering, delivery questions, or hours/menu questions?
- What has to happen for a phone order to be useful: POS ticket, kitchen printer, text summary, or callback?
- Would answering without POS write-back create more work for staff?

### Watchlist: Professional Services

- What information can safely be collected before a licensed professional is involved?
- What should the receptionist never say?
- Are calls privileged, regulated, or sensitive?
- Is human fallback required for trust?

## Copy / Positioning Test

Read each line and ask: “Which sounds most useful or trustworthy?”

1. Every call covered. Every lead captured.
2. When you can't answer, we pick up and hand you the job details.
3. Stop losing jobs to voicemail.
4. A flat-rate phone handoff layer for local operators.

Follow-up:

- What phrase sounds fake or too software-y?
- What would you tell another owner this does?
- Would you trust this more if it did not lead with AI?

## Scoring

Score each interview from 1–5:

| Score | Meaning                                                     |
| ----- | ----------------------------------------------------------- |
| 1     | No pain, no clear handoff destination, no buying signal     |
| 2     | Some pain, but product would need major new scope           |
| 3     | Real pain, simple handoff, uncertain willingness to pay     |
| 4     | Strong pain, clear handoff, wants demo or pilot             |
| 5     | Strong pain, clear handoff, urgent timeline, willing to pay |

## Evidence Capture

For each call, save notes using `docs/operations/discovery-scorecard.md`.

Must-capture fields:

- Exact owner quote about missed calls.
- Current phone setup.
- Current destination tool.
- Average job/order/appointment value.
- What must be escalated.
- What must never be handled.
- Willingness to try demo.
- Willingness to pay.

## Decision Rule

Do not change MVP scope from interviews alone. Promote a segment or feature only if it clears `docs/operations/customer-evidence-gates.md` and the founder explicitly approves the shift.
