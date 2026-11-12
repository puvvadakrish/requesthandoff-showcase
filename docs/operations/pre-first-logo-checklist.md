---
title: Pre-First-Logo Checklist
date: 2026-06-02
status: draft
parent: docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md
---

# Pre-First-Logo Checklist

This checklist defines what must be true before RequestHandoff puts a real operator on a live pilot or paid account. It complements the MVP plan and should be checked before founder outreach converts into production usage.

## 1. Account Provisioning

- [ ] Vercel project exists and `requesthandoff.com` is connected.
- [ ] Supabase production project exists in `us-east-1`; anon/service keys are stored only in platform env vars.
- [ ] Render voice service and post-call worker exist in Virginia / US East.
- [ ] Retell production account is configured with a tenant-safe production agent and separate demo agent.
- [ ] Resend or selected email provider has DKIM/SPF configured.
- [ ] Sentry projects exist for dashboard, voice, and post-call worker.
- [ ] Stripe products/payment links exist for Starter, Growth, and Pro.
- [ ] Demo link abuse controls are appropriate for the send pattern: founder-sent links can rely on approval, expiry, session caps, per-IP rate limiting, and budget breaker; enable Cloudflare Turnstile only before broad/public distribution.

## 2. Tenant Readiness

- [ ] Business name, vertical, service area, hours, services offered, services not offered, owner escalation phone, and escalation email are loaded.
- [ ] Tenant status is `draft` until the founder approves go-live.
- [ ] Retell agent maps to tenant through `agent_to_tenant`; inbound webhooks never trust tenant IDs from request bodies.
- [ ] Greeting and recording disclosure are approved by founder/operator.
- [ ] Urgency rules are reviewed with operator; life-safety rules are not weakened.
- [ ] The operator confirms what should not be handled by the agent.

## 3. Call Forwarding / Phone Setup

- [ ] Operator's current phone setup is known: cell, landline, VoIP, Google Voice, carrier business line, or call tracking number.
- [ ] Forwarding path is chosen: conditional forwarding, after-hours forwarding, full forwarding during pilot windows, or separate pilot number.
- [ ] A rollback path is documented so the operator can disable forwarding quickly.
- [ ] Test call confirms audio, greeting, tool calls, and end-of-call webhook behavior.
- [ ] Founder has operator's emergency contact during pilot window.

## 4. Handoff Delivery

- [ ] Email delivery is configured and tested; email cannot be disabled at MVP.
- [ ] Optional webhook or Zapier-routable delivery is configured only if the tenant needs it and credentials are ready; native Jobber/HCP/ServiceTitan integrations stay out of MVP unless founder-approved.
- [ ] Failed delivery behavior is tested: email still sends if optional integration fails.
- [ ] Lead summary includes caller, service, urgency, location, preferred window, recommended action, and confidence/missing-info flags.

## 5. Escalation Reliability

- [ ] `escalate_now` refuses escalation when no approved urgency rule matches.
- [ ] Warm-transfer target phone is correct.
- [ ] Owner hears a concise brief before bridge.
- [ ] Escalation attempt logs timestamp, target, ring duration, outcome, and resulting lead status.
- [ ] No escalation attempt can silently fail.

## 6. Dashboard / Operator View

- [ ] Owner can log in.
- [ ] Owner can see leads, lead detail, escalation log, and usage.
- [ ] Owner can mark lead outcome and attributed value.
- [ ] Low-confidence leads clearly prompt transcript review.
- [ ] Dashboard copy does not present RequestHandoff as a system of record.

## 7. Compliance / Trust

- [ ] `docs/operations/compliance-stance.md` has been reviewed for the current launch state.
- [ ] `docs/operations/failure-mode-contract.md` has been reviewed for customer-facing promises and internal incident handling.
- [ ] Texas recording disclosure is present even though Texas is one-party consent.
- [ ] Out-of-Texas usage is not offered unless compliance stance is updated.
- [ ] PII is not logged in app logs.
- [ ] Failure-mode promise is not overstated in sales copy.
- [ ] Operator understands the product captures and hands off leads; it does not guarantee job booking.

## 8. Go / No-Go

**Go when:**

- Test calls work end-to-end.
- Lead extraction and email delivery work.
- Operator has approved urgency rules and greeting.
- Founder has rollback instructions and monitoring access.
- The pilot window is bounded and known.

**No-go when:**

- Call forwarding is untested.
- Escalation behavior is unclear.
- Delivery path is not verified.
- Operator expects calendar booking, quoting, payment, or CRM replacement.
- Compliance assumptions differ from the Texas-only MVP.

## 9. First 48 Hours Monitoring

Track during the first live pilot window:

- Number of calls answered.
- Number of qualified leads captured.
- Urgent escalations attempted and outcomes.
- Delivery failures or retries.
- Low-confidence summaries.
- Operator feedback on false positives / false negatives.
- Any caller confusion about the agent or recording disclosure.

The founder should manually review every first-logo call before using it as proof in outbound or case-study material.
