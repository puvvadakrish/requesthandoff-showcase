---
title: First Live Pilot Record Template
date: 2026-06-03
status: template
parent: docs/operations/first-live-pilot-runbook.md
---

# First Live Pilot Record Template

Copy this template into a private, non-git pilot note before production call forwarding starts. Do not commit a filled pilot record that includes owner contact details, caller PII, phone routing details, or production agent IDs.

Use only a founder-approved private system. Before entering operator or production details, record its owner, least-privilege sharing, encryption, backup/export behavior, retention deadline, deletion triggers, and incident owner. Do not copy caller-level facts into this pilot record; keep them only in the product systems approved for call and lead data.

## Pilot Summary

| Field                          | Value                          |
| ------------------------------ | ------------------------------ |
| Pilot owner                    | Krish                          |
| Business name                  |                                |
| Tenant ID                      |                                |
| Retell demo agent ID           |                                |
| Retell production agent ID     |                                |
| Retell production phone number |                                |
| Pilot window                   |                                |
| Owner emergency contact        |                                |
| Handoff baseline               | Email                          |
| Optional handoff destination   | None / webhook-Zapier-routable |
| Stripe/payment or trial terms  |                                |
| Rollback path                  |                                |
| Independent hard-stop path     |                                |

## Private Record Controls

- Record-system owner:
- Authorized viewers:
- Encryption confirmed:
- Backup/export behavior:
- Retention deadline:
- Deletion triggers:
- Incident-response owner:

## Pre-Go-Live Safety Evidence

Any blank or failed required row means **no-go**.

| Gate | Result | Evidence pointer | Verifier / date | Notes |
| --- | --- | --- | --- | --- |
| Compliance stance reviewed for this Texas-only inbound pilot | pass / fail | | | |
| Failure-mode contract reviewed | pass / fail | | | |
| Tenant remains `draft` pending go decision | pass / fail | | | |
| Production agent-to-tenant mapping verified | pass / fail | | | |
| Demo and production agents separated | pass / fail | | | |
| Greeting and recording disclosure approved | pass / fail | | | |
| Services, service area, hours, and urgency rules approved | pass / fail | | | |
| Life-safety baseline preserved | pass / fail | | | |
| Escalation phone and email confirmed | pass / fail | | | |
| Mandatory email delivery configured, tested, and cannot be disabled | pass / fail | | | |
| Optional webhook credentials and delivery tested, or not applicable | pass / fail / n/a | | | |
| Durable `call_ended` acceptance | pass / fail | | | |
| Replay and idempotency | pass / fail | | | |
| Caller-field and transcript encryption | pass / fail | | | |
| Encryption key rotation and recovery | pass / fail | | | |
| Caller-data store inventory and lifecycle policy approved | pass / fail | | | |
| Per-store deletion, provider limitation, backup/expiry, and audit evidence reviewed | pass / fail | | | |
| Owner acknowledges structured-handoff-only scope | pass / fail | | | |
| Owner-approved lead destination and pilot window recorded | pass / fail | | | |
| Rollback instructions written and shared | pass / fail | | | |
| Independent carrier/provider hard-stop tested | pass / fail | | | |
| Exact routing rollback rehearsed | pass / fail | | | |
| Founder access to every monitoring surface confirmed | pass / fail | | | |
| Monitoring active for required 30-minute lead-in | pass / fail | | | |
| Payment complete or written trial terms approved | pass / fail | | | |

### Caller-Data Store Inventory

Do not place caller-level values in this matrix. Record controls and evidence pointers only.

| Data category / store | Access owner | Retention | Deletion / tenant exit | Provider copies / backup expiry | Exception ID / link | Audit and deletion-test evidence | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RequestHandoff call and lead records | | | | | | | pass / fail |
| Retell recording and transcript copies | | | | | | | pass / fail |
| Application and provider logs | | | | | | | pass / fail |
| Email handoff destination | | | | | | | pass / fail |
| Optional webhook / customer destination | | | | | | | pass / fail / n/a |
| Exports and backups | | | | | | | pass / fail |

Any retained store without an approved lifecycle, tested deletion mechanism, or explicitly accepted provider limitation means **no-go**.

### Provider Control Exceptions

An exception cannot waive a policy control marked non-waivable or change a customer-facing privacy/compliance promise without separate founder and qualified review.

| Exception ID | Store / control | Provider evidence | Affected promise and caller impact | Compensating controls | Approver / date | Expiry / re-review | Legal/provider disposition | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | | pass / fail |

Every field in an applicable exception row is required. Any blank or failed field means **no-go**. Each caller-data store exception reference must resolve to exactly one complete, passing, unexpired exception row.

## Approved Tenant Facts

- Greeting and recording disclosure:
- Services offered:
- Services not offered:
- Service area:
- Hours:
- Coverage window:
- Urgency rules:
- Life-safety baseline preserved: yes / no
- Escalation phone confirmed: yes / no
- Escalation email confirmed: yes / no
- Owner understands handoff-only scope: yes / no

## Test Calls

| Test                        | Result            | Evidence pointer | Notes |
| --------------------------- | ----------------- | ---------------- | ----- |
| T1 baseline lead capture    | pass / fail       |                  |       |
| T2 urgent escalation        | pass / fail       |                  |       |
| T3 non-urgent boundary      | pass / fail       |                  |       |
| T4 low-confidence summary   | pass / fail       |                  |       |
| T5 optional handoff failure | n/a / pass / fail |                  |       |
| T6 rollback rehearsal and final disabled state | pass / fail | | |

Treat call IDs, lead IDs, provider dashboard links, delivery IDs, and incident IDs as sensitive pseudonymous record pointers. Keep them only in the approved private pilot system and out of repository summaries; prefer an access-controlled internal incident ID when it is sufficient.

## Monitoring Setup

- Retell dashboard access confirmed:
- Render voice logs access confirmed:
- Render post-call logs access confirmed:
- Supabase tables access confirmed:
- Runtime error/log access confirmed:
- Email provider dashboard access confirmed:
- First 48-hour monitoring owner:
- Monitoring start time:
- Monitoring end time:

## Go / No-Go

- All required pre-go-live evidence rows pass: yes / no
- Every caller-data store row passes or is not applicable: yes / no
- Every provider exception is complete and passes, or none apply: yes / no
- T1-T4 and T6 pass; T5 passes or is not applicable: yes / no
- Pilot routing remains disabled pending this decision: yes / no
- Founder monitoring access and 30-minute lead-in confirmed: yes / no
- Owner-approved lead destination and pilot window confirmed: yes / no
- Payment complete or written trial terms confirmed: yes / no
- Go-live decision: go / no-go
- Decision time:
- Decision owner:
- Remaining blockers:
- Owner notified:

## Daily Pilot Notes

### Day 1

- Calls answered:
- Qualified leads captured:
- Urgent escalations:
- Delivery issues:
- Low-confidence/manual-review items:
- Owner feedback:
- Tuning actions:

### Day 2

- Calls answered:
- Qualified leads captured:
- Urgent escalations:
- Delivery issues:
- Low-confidence/manual-review items:
- Owner feedback:
- Tuning actions:

## Rollback / Incident Notes

Use `docs/operations/failure-mode-contract.md` for any incident review.

- Rollback triggered: yes / no
- Trigger:
- Primary disable result:
- Independent hard stop invoked: yes / no / not needed
- Safe-flow verification call result and evidence:
- Founder monitoring remained active: yes / no
- Owner action taken:
- Founder confirmation:
- Incident record:
- Retest required before resume: yes / no

## Pilot Record Closeout

- Closeout trigger: pilot ended / owner withdrew / setup abandoned / retention deadline / other
- Pilot end date:
- Closeout owner:
- Closeout due date:
- Private record deleted or minimized:
- Completion timestamp and verifier:
- Bounded retention exception ID, approver/date, reason/impact, compensating controls, and expiry/re-review date, if any:
- Backup/export expiry confirmed:
- Provider-copy follow-up complete:
- Production evidence pointers disposed:
- Non-sensitive completion receipt location:

### Per-Store Closeout Reconciliation

| Data category / store | Disposition | Completion evidence | Verifier / date | Remaining provider / backup copy | Valid bounded exception ID and expiry | Result |
| --- | --- | --- | --- | --- | --- | --- |
| RequestHandoff call and lead records | delete / minimize / retain | | | | | pass / fail |
| Retell recording and transcript copies | delete / minimize / retain | | | | | pass / fail |
| Application and provider logs | delete / minimize / retain | | | | | pass / fail |
| Email handoff destination | delete / minimize / retain | | | | | pass / fail |
| Optional webhook / customer destination | delete / minimize / retain / n/a | | | | | pass / fail / n/a |
| Exports and backups | delete / minimize / retain | | | | | pass / fail |

Do not issue the non-sensitive completion receipt until every applicable row passes or has a still-valid bounded exception.
