---
title: Failure-Mode Contract
date: 2026-06-02
status: draft
parent: docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md
---

# Failure-Mode Contract

This draft defines what RequestHandoff should promise, monitor, and do when calls or handoffs fail. It should become customer-facing only after founder and legal review.

## Principle

RequestHandoff sells covered calls and structured handoff, not perfect automation. The trustworthy promise is: we will answer, qualify, hand off, log what happened, and make failures visible quickly.

## Non-Promises

Do not promise:

- Guaranteed booked jobs.
- Perfect urgency classification.
- Guaranteed owner pickup during escalation.
- Calendar booking, quoting, payment, or dispatch replacement.
- 24/7 human fallback.
- Coverage outside approved tenant rules.

## Failure Classes

### 1. Dead Air / Voice Runtime Failure

**Examples:** Retell answers but caller hears silence, tool latency creates unacceptable pause, call drops unexpectedly.

**Detection:** synthetic test calls, call logs, owner/caller feedback, low-duration abandoned calls.

**Response:** mark incident, review transcript/audio/logs, notify owner if production call affected, pause forwarding if repeated.

**Customer promise:** affected calls are reviewed manually; repeated failures trigger rollback to previous phone setup until stable.

### 2. Missed Escalation

**Examples:** approved urgent rule fires but warm transfer does not attempt, owner number is wrong, bridge fails, or attempt is not logged.

**Detection:** escalation log missing/failed, urgent lead with no attempt, owner report.

**Response:** call owner manually when discovered, correct configuration, document cause, review all urgent calls in same window.

**Customer promise:** no urgent escalation attempt should silently fail; every attempt must be logged.

### 3. False-Positive Escalation

**Examples:** standard call gets escalated as urgent, owner is interrupted unnecessarily.

**Detection:** owner marks false positive, review of urgency rule, repeated rule mismatch.

**Response:** tune tenant urgency rules, preserve life-safety defaults, document change.

**Customer promise:** the business controls urgency rules; RequestHandoff will adjust over-triggering quickly.

### 4. Low-Confidence / Wrong Summary

**Examples:** missing caller phone, wrong service category, uncertain urgency, incomplete location.

**Detection:** extraction confidence below threshold, owner correction, missing-information flags.

**Response:** surface review prompt, keep transcript available, improve extraction examples/rules.

**Customer promise:** low-confidence leads are marked for review instead of pretending certainty.

### 5. Delivery Failure

**Examples:** email bounces, Jobber/API fails, webhook returns 500, credentials expire.

**Detection:** delivery table status, retry exhaustion, email bounce, integration auth error.

**Response:** retry with backoff, keep email baseline active, notify founder/operator if optional channel fails repeatedly.

**Customer promise:** email remains the always-on fallback at MVP; optional integration failure should not block email delivery.

### 6. Call Forwarding / Phone Plumbing Failure

**Examples:** forwarding not active, carrier setup wrong, calls loop, operator cannot disable forwarding.

**Detection:** test call fails, owner report, no calls during expected pilot window.

**Response:** revert to documented rollback path, retest, update setup notes.

**Customer promise:** every go-live needs a tested rollback path.

## MVP Customer Credit Policy

Internal draft: if RequestHandoff misses an approved urgent escalation due to our system failure, offer a simple service credit or free-month remedy at founder discretion. Do not publish this until legal and pricing review.

Suggested private operating rule:

- First confirmed system-caused missed escalation: founder apology + incident report + $10 credit or equivalent goodwill.
- Repeated system-caused missed escalations: pause service, fix root cause, and offer free month or refund for affected period.

## Incident Review Template

```markdown
## Incident

- Tenant:
- Call ID:
- Time:
- Failure class:
- Customer impact:

## Timeline

- What happened:
- When detected:
- Who was notified:

## Root Cause

- System/config/vendor/human:

## Fix

- Immediate mitigation:
- Permanent fix:
- Owner communication:

## Prevention

- Test added:
- Monitor added:
- Doc/config updated:
```

## Go-Live Requirement

Before first logo production usage, the founder must be able to answer:

- How do we know if the agent answered?
- How do we know if escalation was attempted?
- How do we know if delivery succeeded?
- How does the operator turn this off?
- What do we say if it fails?
