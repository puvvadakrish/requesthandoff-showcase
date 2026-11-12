---
title: Demo-To-First-Logo Playbook
date: 2026-06-02
status: draft
parent: docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md
---

# Demo-To-First-Logo Playbook

This playbook turns discovery interest into the first live RequestHandoff logo. It covers the founder-operated path from prospect selection through personalized demo, kickoff, payment, call forwarding, go-live, first 48 hours, and post-pilot conversion.

## Operating Principle

The first logo is not self-serve. It is a founder-led, high-touch pilot designed to prove one thing:

> Can RequestHandoff reliably cover calls the owner would otherwise miss, capture qualified leads, and hand them off into the tools the business already uses?

Do not use the first-logo process to expand scope. No calendar booking, quoting, payments, SMS, outbound AI prospecting, POS write-back, regulated intake, or CRM replacement.

## Entry Criteria

Do not start this playbook until:

- Discovery notes are captured in `docs/operations/discovery-scorecard.md`.
- The operator is in the launch wedge or an explicitly approved adjacent experiment.
- The operator has no disqualifier from the scorecard.
- The operator understands RequestHandoff captures and hands off leads; it does not guarantee booked jobs.
- `docs/operations/compliance-stance.md` and `docs/operations/failure-mode-contract.md` have been reviewed for the current pilot.

## Phase 1: Prospect Selection

Prioritize prospects in this order:

1. Austin-area home or property service operator.
2. Owner-operated, 1–10 employees.
3. Misses calls during job-site hours, after-hours, weekends, lunch, or surge periods.
4. Has a simple handoff destination: email, Jobber, Housecall Pro, ServiceTitan, Google Sheet, Slack, or webhook-backed automation.
5. Can safely test a pilot number or call-forwarding path.
6. Reacts positively to flat-rate / no escalation fees.

Avoid prospects who need calendar booking, dispatch replacement, quote generation, payment collection, or regulated intake to see value.

## Phase 2: Pre-Demo Research

Before building the demo, collect:

- Website and Google Business Profile.
- Business name, service area, hours, services offered, and services not offered.
- Current phone setup if known.
- Current destination tool.
- Likely high-value services.
- Likely urgent calls.
- One sentence of personalized outreach tied to their business.

Use the website/GBP extractor where available. If extracted details are uncertain, label them as review-needed instead of inventing.

## Phase 3: Personalized Demo Setup

Create a prospect demo that proves “this sounds like your business,” not “look at our AI.”

Demo must include:

- Business-specific greeting with recording disclosure.
- Services offered and not offered.
- Service area or ZIP assumptions.
- Basic hours behavior.
- Vertical intake fields.
- Urgency rules if known; otherwise conservative defaults only.
- Email handoff preview.
- Separate demo agent, not production tenant agent.
- Founder approval before link is sent.

Demo must not include:

- Production forwarding.
- Real customer PII.
- Claims that integrations are live if they are only webhook/Zapier-routable.
- Any promise of calendar booking, quoting, payment, or dispatch.

## Phase 4: Outreach

Use short owner-language outreach. Lead with the business outcome, not AI.

Example:

> Quick one — I built a 90-second preview of how [Business] could answer calls when you’re on a job or closed. It captures the caller, service, urgency, location, and preferred window, then hands you a clean summary. Flat monthly price, no escalation fees, and it works with the tools you already use. Want me to send it?

If sending a demo URL:

- Personalize the first sentence.
- State that it was built from public website/GBP info and may need correction.
- Ask for one action: listen, reply with what is wrong, or book a short kickoff.
- Do not send outbound AI calls.
- Do not imply the prospect has opted into SMS or automated follow-up.

## Phase 5: Demo Review Call

Goal: turn curiosity into a bounded pilot decision.

Agenda:

1. Confirm their current missed-call pattern.
2. Play or walk through the demo.
3. Ask what sounded wrong.
4. Confirm where lead summaries should land.
5. Confirm what counts as urgent.
6. Explain flat-rate pricing and no escalation fees.
7. Explain that MVP captures and hands off leads; it does not book jobs.
8. Ask whether they want a bounded pilot.

Strong close:

> If we can cover the calls you miss this week and hand you clean lead summaries without changing your tools, would you be open to trying it for a bounded pilot?

## Phase 6: Kickoff Checklist

Use `docs/operations/pre-first-logo-checklist.md` as the source of truth.

Minimum kickoff outputs:

- Approved greeting and recording disclosure.
- Approved services offered / not offered.
- Approved service area.
- Approved urgency rules.
- Confirmed lead summary destination.
- Confirmed escalation phone and email.
- Confirmed phone setup and rollback path.
- Confirmed pilot window.
- Confirmed plan tier or trial terms.

If any of these are missing, keep tenant in `draft`.

## Phase 7: Payment / Trial Setup

MVP billing uses manual Stripe payment links and manual plan-tier setting.

Options:

- Trial: bounded 7–14 day pilot with explicit pilot window and success criteria.
- Paid: Starter/Growth/Pro payment link, then tenant plan set manually.

Before sending a payment link:

- Make clear what is included.
- Make clear there are no escalation fees.
- Make clear overages are tracked manually in MVP.
- Do not promise self-serve cancellation or automated overage handling unless implemented.

## Phase 8: Call Forwarding / Pilot Number

Choose the least risky path:

1. Separate pilot number if the owner is nervous.
2. Conditional forwarding after no-answer.
3. After-hours forwarding.
4. Full forwarding only after test calls and owner confidence.

Required before go-live:

- Test call confirms greeting.
- Test call confirms tool behavior.
- Test call confirms lead extraction.
- Test call confirms email delivery.
- Escalation test confirms owner brief and logging.
- Rollback path is written and shared with owner.

No rollback path means no go-live. Tiny rule, saves giant mess.

## Phase 9: Go / No-Go

### Go

- Operator matches launch scope or approved experiment.
- Call forwarding/pilot number is tested.
- Recording disclosure is present.
- Urgency rules are approved.
- Lead delivery is verified.
- Escalation path is verified or explicitly disabled.
- Founder can monitor calls, deliveries, and escalations.
- Owner knows how to reach founder during the pilot.
- Payment link is paid, or a written trial agreement exists, before production forwarding goes live.

### No-Go

- Owner expects booking, quoting, payment, dispatch, or CRM replacement.
- Compliance assumptions differ from Texas-only MVP.
- Call forwarding is untested.
- Escalation behavior is unclear.
- Email delivery is not verified.
- Owner cannot disable forwarding quickly.
- Founder cannot personally monitor the first 48 hours.
- Demo configuration and production tenant configuration differ in greeting, services, service area, urgency rules, or handoff destination.

## Phase 10: First 48 Hours

Founder manually reviews every call.

Track:

- Calls answered.
- Qualified leads captured.
- Caller confusion.
- Low-confidence summaries.
- Missing fields.
- Urgent escalations attempted.
- False-positive / false-negative urgency feedback.
- Delivery failures or retries.
- Owner response time and satisfaction.

Pause forwarding if:

- Founder cannot monitor the pilot window.
- Dead air, delivery failure, or missed escalation repeats.
- Owner changes phone/carrier settings without retesting.
- Owner becomes unavailable for urgent warm transfers during the agreed pilot window.

Daily owner update:

> Here’s what came in, what we captured, what looked urgent, and what I’m tuning before the next call window.

Do not use first-logo calls in marketing without explicit permission.

Owner must receive a written emergency-off instruction:

> To turn RequestHandoff off immediately, disable [forwarding setting / pilot number routing] and text/call Krish at [number]. If anything feels wrong, turn it off first; we can debug after your main line is safe.

## Phase 11: Pilot Success Review

At the end of the pilot, review:

- Number of covered calls.
- Number of qualified leads.
- Number of leads the owner would likely have missed.
- Any booked jobs or self-attributed value.
- Escalation precision.
- Delivery reliability.
- Owner trust level.
- Whether the owner would refer another operator.
- Whether urgent warm-transfer availability was realistic for the owner.

Conversion question:

> Based on what we caught and handed off, does it make sense to keep this running on [Starter/Growth/Pro]?

## Phase 12: Case Study Capture

If the owner is happy, capture:

- Business name and city.
- Before state: missed-call pattern.
- During pilot: calls covered and leads captured.
- One exact owner quote.
- Tool destination used.
- Whether they would refer a peer.
- Permission level: private learning, anonymized proof, named case study.
- Explicit consent before using call snippets, transcripts, screenshots, testimonials, or business name.

Store future case-study artifacts under `docs/case-studies/`.

## Configuration Parity Check

Before switching from demo to production tenant, compare:

- Business name and greeting.
- Recording disclosure.
- Services offered and not offered.
- Service area.
- Hours.
- Urgency rules.
- Escalation phone and email.
- Handoff destination.
- Optional integration status.

If demo and production differ, re-run a test call before forwarding real traffic.

## Pivot / Fallback

If demo interest is high but kickoff conversion is weak:

- Rework outreach framing.
- Ask what made the demo feel non-essential.
- Compare scorecard data for mobile/vehicle services.
- Consider sandbox-first trial only if it does not add self-serve scope.

If live pilot fails operationally:

- Pause forwarding.
- Run incident review using `docs/operations/failure-mode-contract.md`.
- Fix the root cause before adding another logo.

## Playbook Exit Criteria

This playbook succeeds when:

- One real operator completes a bounded live pilot.
- At least one qualified lead is captured and handed off.
- The owner confirms whether the handoff was useful.
- Failure modes, if any, are visible and handled.
- The founder knows whether to continue the current wedge, adjust the demo motion, or run another discovery sprint.
