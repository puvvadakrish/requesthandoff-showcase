---
title: First Live Pilot Runbook
date: 2026-06-03
status: draft
parent: docs/operations/pre-first-logo-checklist.md
---

# First Live Pilot Runbook

This runbook is the founder's executable go-live procedure for one bounded RequestHandoff pilot. It assumes the prospect has passed the discovery scorecard and demo-to-first-logo playbook gates.

The pilot proves one thing: RequestHandoff can answer calls the owner would otherwise miss, capture structured leads, and hand them off into the tools the business already uses. It does not prove booking, quoting, payment, SMS, dispatch replacement, or CRM replacement.

## 1. Pilot Record

Create a private pilot record before touching forwarding. Use `docs/operations/first-live-pilot-record-template.md` as the starting point, but copy it into a founder-approved private, non-git system before filling real operator details. Before use, document the record owner, least-privilege sharing, encryption, backup/export behavior, retention deadline, deletion triggers, and incident owner. A generic private note without these controls does not satisfy this gate.

| Field                          | Value                                  |
| ------------------------------ | -------------------------------------- |
| Pilot owner                    | Krish                                  |
| Business name                  |                                        |
| Tenant ID                      |                                        |
| Retell demo agent ID           |                                        |
| Retell production agent ID     |                                        |
| Retell production phone number |                                        |
| Pilot window                   |                                        |
| Owner emergency contact        |                                        |
| Handoff baseline               | Email                                  |
| Optional handoff destination   | Webhook/Zapier-routable only if tested |
| Rollback path                  |                                        |
| Independent hard-stop path     |                                        |

Do not commit a filled pilot record. Store caller-level facts only in the product systems designed for call and lead records.

## 2. Pre-Go-Live Gates

All non-routing gates must pass before the controlled routing rehearsal in T6. Every gate, including T6, must pass before accepting live customer forwarding:

- Compliance stance reviewed for Texas-only, inbound-only MVP.
- Failure-mode contract reviewed with the founder.
- Tenant is `draft` until go-live approval.
- Production Retell agent maps to tenant through `agent_to_tenant`.
- Demo agent and production agent are separate.
- Greeting includes the approved recording disclosure.
- Services offered, services not offered, service area, hours, and urgent rules are approved by the owner.
- Life-safety rules are not weakened.
- Escalation phone and escalation email are confirmed.
- Email delivery is configured and cannot be disabled.
- Optional webhook delivery is configured only if credentials are ready and test delivery succeeds.
- Retell `call_ended` is durably accepted before asynchronous post-call work, and replay/idempotency tests pass. The current synchronous forwarding path does not satisfy this gate.
- Caller fields and transcripts use reviewed app-level encryption at rest with documented key rotation and recovery. Current RLS/service-role isolation is necessary but not sufficient for this gate.
- A founder-approved caller-data policy inventories each caller-data category and store, including recordings, transcripts, extracted caller/lead fields, application logs, handoff destinations, provider-held copies, and backups/exports. For each retained copy it defines access roles, retention duration, deletion and tenant-exit triggers, backup/export expiry, deletion mechanism and test evidence, and audit evidence for sensitive access, export, retention-change, and deletion actions where the system supports it. Any unsupported provider control has a bounded exception naming the exact store/control, provider evidence, affected promise and caller impact, compensating controls, approver/date, expiry/re-review date, and legal/provider-review disposition. An exception cannot waive a control marked non-waivable by the approved policy or change a customer-facing privacy/compliance promise without separate founder and qualified review.
- Owner understands RequestHandoff captures and hands off structured leads; it does not guarantee booked jobs.
- Rollback instructions are written and shared with the owner.
- A secondary carrier/provider hard-stop path that does not depend on the primary forwarding toggle is documented and tested; the private record names its owner, contact path, and safe owner-controlled destination.
- The exact forwarding/routing rollback has been rehearsed: disable it, prove a call returns to the owner's original flow, restore it, and rerun T1 successfully.

No rollback path means no go-live.

No durable provider-event acknowledgment, caller-field encryption, approved caller-data lifecycle, or rehearsed rollback means no go-live, even when demo fixtures and hosted health checks pass.

## 3. Test Calls

Run these in order. Use the same production tenant configuration that will receive forwarded calls.

### T1. Baseline Lead Capture

Scenario: standard service request with caller name, callback phone, service, location, and preferred window.

Pass when:

- Agent answers with approved greeting and recording disclosure.
- Tool behavior matches hours and service-area rules.
- Post-call worker creates one call and one structured lead.
- Email handoff arrives with caller, service, urgency, location, preferred window, recommended action, confidence, and missing-info flags.
- No transcript or caller PII appears in application logs.

### T2. Urgent Escalation

Scenario: approved urgent rule fires, such as HVAC system down with vulnerable occupant or another owner-approved urgent rule.

Pass when:

- `escalate_now` fires only because an approved urgency rule matches.
- Warm transfer target is the approved owner phone.
- Owner hears a concise brief before bridge.
- Escalation attempt is logged with timestamp, target, duration if available, outcome, and resulting lead status.
- Lead summary marks urgency and escalation outcome clearly.

### T3. Non-Urgent Boundary

Scenario: caller uses stressful language but no approved urgency rule matches.

Pass when:

- Agent captures the lead without inventing an emergency policy.
- `escalate_now` does not fire.
- Lead marks urgency as standard or elevated based on configured rules.
- Missing or uncertain fields are flagged instead of hidden.

### T4. Low-Confidence Summary

Scenario: caller provides an incomplete request, such as no callback number or unclear location.

Pass when:

- Agent attempts to collect the missing field without over-questioning.
- Lead is created with the missing or uncertain field flagged.
- Low confidence is visible in the lead summary.
- Founder knows whether the call requires transcript review before using it as pilot proof.

### T5. Optional Handoff Failure

Run only when optional webhook/Zapier-routable delivery is enabled.

Scenario: webhook returns a 500 or is temporarily unavailable.

Pass when:

- Email delivery still succeeds.
- Webhook delivery records failed or retry status separately.
- Optional delivery failure does not block the lead record or email baseline.
- Founder knows whether to keep optional handoff enabled for the pilot.

### T6. Rollback Rehearsal

Run in a founder-monitored test window with no live customer traffic and the exact forwarding or pilot-number routing mode intended for production.

Pass when:

- The test begins with pilot routing disabled and a call reaches the owner's original phone flow.
- The owner enables the exact pilot routing and T1 passes.
- The owner disables routing again and a call reaches the original flow.
- The owner restores the exact pilot routing and T1 passes again.
- The owner disables pilot routing a final time and confirms the original flow remains active pending the go/no-go decision.
- Every enable, disable, original-flow check, restore, and T1 result has a timestamp and evidence in the private pilot record.

If any enable, disable, restore, original-flow check, or T1 fails, record **no-go** and keep founder monitoring active. Attempt the primary disable; if it does not work, invoke the independent carrier/provider hard-stop path. Do not end the procedure until a test call proves the owner's original flow or the approved safe owner-controlled destination. Do not leave pilot routing enabled after the rehearsal.

## 4. Monitoring Window

Founder monitors from 30 minutes before forwarding starts until 48 hours after first live call, or through the agreed pilot window if shorter.

Watch these systems:

- Retell call dashboard for answered calls, low-duration calls, tool errors, warm-transfer outcomes, and demo/production agent separation.
- Render voice logs for hot-path tool latency, `check_hours`, `check_service_area`, `request_schedule_window`, and `escalate_now` outcomes.
- Render post-call logs for `call_ended`, extraction status, delivery status, retry status, and missing transcript.
- Supabase tables for calls, leads, escalations, deliveries, and `agent_to_tenant` mapping.
- Email provider dashboard for send, bounce, and delivery status.

Useful log search terms:

- `post-call rejected unknown agent`
- `post-call tenant config missing`
- `post-call missing transcript`
- `post-call extraction routed to manual review`
- `email send attempt failed`
- `webhook delivery attempt failed`
- `webhook delivery attempt errored`
- `escalate_now`
- `delivery_failed`
- `manual_review`

Healthy signals:

- Every live call has a call record.
- Every completed call with transcript has either a structured lead or manual-review status.
- Every structured lead has an email delivery record.
- Optional webhook failure, if any, is isolated from email delivery.
- Every urgent escalation attempt has an escalation record.
- Owner can identify which leads were useful or not useful.

Failure signals:

- Dead air, dropped call, or repeated low-duration abandoned calls.
- Unknown Retell agent ID in production traffic.
- Missing transcript after a completed production call.
- Email delivery failure for a structured lead.
- Urgent lead with no escalation attempt when an approved rule matched.
- Escalation attempt not logged.
- Owner cannot disable forwarding quickly.
- Caller or owner confusion caused by overpromising booking, quoting, payment, or dispatch behavior.

## 5. Rollback Triggers

Pause forwarding immediately when any of these happen:

- Dead air or dropped-call failure repeats.
- Email delivery fails for any production lead and cannot be fixed immediately.
- Approved urgent escalation is missed due to RequestHandoff system/config failure.
- Production agent maps to the wrong tenant or unknown tenant.
- Owner changes carrier/phone routing without a retest.
- Founder cannot monitor the pilot window.
- Owner asks to pause.

Rollback action:

1. Keep founder monitoring active and attempt the documented primary forwarding or routing disable.
2. If the primary action fails, or a verification call does not reach the original flow, invoke the independent carrier/provider hard stop immediately.
3. Do not proceed until a test call proves the owner's original flow or the approved safe owner-controlled destination.
4. Founder records the primary action, hard-stop use, verification evidence, and incident using `docs/operations/failure-mode-contract.md`.
5. Founder fixes and retests before forwarding resumes.

## 6. Owner Communications

Before go-live, send:

```text
We are starting a bounded RequestHandoff pilot during [window]. It will answer calls you would otherwise miss, capture structured lead details, and hand them to you by email [and optional destination if tested]. It will not book jobs, quote work, take payments, or replace your dispatch tool.

To turn it off immediately: [rollback instruction]. If anything feels wrong, turn it off first and call/text me at [founder number].
```

Daily during the first 48 hours, send:

```text
Here is what came in today: [calls answered], [qualified leads], [urgent escalations], [delivery issues or none], and [anything I am tuning]. Please mark which leads were useful and tell me what sounded wrong.
```

After pilot window, ask:

```text
Based on what RequestHandoff caught and handed off, does it make sense to keep this running on [Starter/Growth/Pro]?
```

## 7. Go / No-Go Decision

Go only when:

- Every pre-go-live gate in section 2 has recorded pass evidence in the private pilot record.
- Test calls T1 through T4 pass.
- T5 passes if optional webhook delivery is enabled.
- T6 passes for the exact production routing mode.
- Owner approved greeting, service boundaries, urgency rules, escalation contact, lead destination, pilot window, and rollback.
- Founder has live access to logs and can monitor the pilot window.
- Payment link is paid or written trial terms exist.

No-go when:

- Call forwarding is untested.
- Email delivery is unverified.
- Escalation behavior is unclear.
- Owner expects booking, quoting, payment, dispatch, SMS, or CRM replacement.
- Compliance assumptions differ from Texas-only inbound MVP.
- Founder cannot personally monitor the first live window.

## 8. Activation After Go

Only after the private record contains a `go` decision:

1. Change the tenant from `draft` to `active`, reload the production configuration, and verify the expected tenant, disclosure, rules, and destinations.
2. Confirm every required monitoring surface is accessible and the founder's monitoring window has been active for at least 30 minutes.
3. In a controlled traffic-free window, enable the exact routing mode rehearsed in T6.
4. Place one final T1 smoke-test call before accepting live customer traffic.
5. If tenant activation, configuration verification, monitoring, routing, or the smoke test fails, disable pilot routing, invoke the independent hard stop if needed, confirm the safe owner-controlled flow, return the tenant to `draft`, and change the decision to **no-go**.

## 9. Pilot Record Closeout

Close the private pilot record when the pilot ends, the owner withdraws, setup is abandoned, or its retention deadline arrives.

- Assign a closeout owner and due date.
- Delete or minimize the private record and its exports according to the approved triggers, or link a separately approved bounded retention exception that records the reason and impact, compensating controls, approver/date, and new expiry/re-review date.
- Reconcile every caller-data store from the pre-go-live inventory to a delete, minimize, or bounded-retention disposition with completion evidence, verifier/date, remaining provider/backup copy, and a still-valid bounded exception when retained. A new deadline without that approval evidence fails closeout.
- Confirm backup/export expiry and any provider-copy follow-up.
- Dispose of production evidence pointers according to the approved policy.
- Record a non-sensitive completion receipt in a separate access-controlled audit location only after every applicable store is reconciled; do not move caller or operator details into git.
