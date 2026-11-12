---
title: "chore: Founder-Led Demo Readiness Finalization"
type: chore
status: complete
date: 2026-06-06
origin: docs/brainstorms/2026-06-06-founder-led-demo-finalization-brainstorm.md
---

# chore: Founder-Led Demo Readiness Finalization

## Summary

Finalize the smallest operational slice needed for a strong founder-led RequestHandoff demo tomorrow: hosted domain health, approved public demo link, Retell webhook wiring, Render voice/post-call delivery, Supabase verification, and a repeatable readiness command.

This does not authorize production call forwarding. Production usage still requires the first-live-pilot runbook gates.

## Scope Boundaries

- Integration-neutral handoff only.
- Structured leads, not transcript-first proof.
- No hidden fees or escalation fees.
- No booking, quotes, payment, SMS, dispatch replacement, or native CRM integration.
- Texas/inbound-only assumptions remain for any future production pilot.

## Work Items

- [x] Confirm `requesthandoff.com` and `www.requesthandoff.com` load over HTTPS.
- [x] Confirm Render voice and post-call health endpoints are live.
- [x] Confirm Retell demo agent webhook is pointed at the Render voice webhook and includes `call_started`, `call_analyzed`, and `call_ended`.
- [x] Confirm direct post-call synthetic call produces structured extraction and Brevo email delivery.
- [x] Confirm full voice webhook synthetic call forwards to post-call and records call/lead/delivery rows in Supabase.
- [x] Increase voice-to-post-call timeout to avoid false Retell retry/failure responses when Gemini plus email delivery exceeds 8 seconds.
- [x] Add `pnpm demo:readiness` as the repeatable hosted readiness harness.
- [x] Confirm approved hosted demo page `sample-auto-demo` loads and returns a Retell web-call token.
- [x] Run relevant dashboard, voice, post-call, and schema checks.

## Evidence

- `pnpm demo:readiness`
  - Dashboard apex: pass.
  - Dashboard `www`: pass.
  - Voice health: pass.
  - Post-call health: pass.
  - Retell demo agent config: pass.
  - Direct post-call synthetic delivery: pass.
  - Voice webhook to post-call synthetic delivery: pass.
  - Supabase call/lead/delivery confirmation: pass.
- Hosted public demo API:
  - `/demo/sample-auto-demo`: HTTP 200.
  - Business-specific page content present.
  - Handoff boundary copy present.
  - `/api/demo/sample-auto-demo/connect`: HTTP 200 with Retell access token and call ID.
- Local checks:
  - `pnpm --filter @requesthandoff/dashboard typecheck`
  - `pnpm --filter @requesthandoff/dashboard test`
  - `pnpm --filter @requesthandoff/dashboard build`
  - `pnpm --filter @requesthandoff/voice typecheck`
  - `pnpm --filter @requesthandoff/voice test`
  - `pnpm --filter @requesthandoff/post-call typecheck`
  - `pnpm --filter @requesthandoff/post-call test`
  - `pnpm --filter @requesthandoff/post-call build`
  - `pnpm --filter @requesthandoff/post-call lint`
  - `pnpm --filter @requesthandoff/schema typecheck`
  - `pnpm --filter @requesthandoff/schema test`

## Morning Demo Checklist

- [ ] Run `pnpm demo:readiness` once before leaving.
- [ ] Open `https://requesthandoff.com/demo/sample-auto-demo`.
- [ ] Make one real browser demo call and verify the handoff email arrives.
- [ ] Use the handoff-only talk track: "we capture the request and deliver it where you already work."
- [ ] Do not enable customer call forwarding unless `docs/operations/first-live-pilot-runbook.md` gates are complete.

## Post-Deploy Monitoring & Validation

Monitor during the demo window:

- Retell call dashboard: call starts, call ends, no low-duration dead-air pattern.
- Render voice logs: `post-call forward failed`, `unknown agent_id on webhook`, `bad_signature`.
- Render post-call logs: `post-call missing transcript`, `post-call extraction routed to manual review`, `email send attempt failed`.
- Supabase: `calls`, `leads`, and `deliveries` rows for the demo call ID.
- Brevo: email accepted/delivered, no sender/domain warning.

Rollback or no-go trigger:

- Domain fails to load.
- Demo connect endpoint fails.
- Voice webhook returns anything other than `post_call_triggered`.
- Email delivery fails.
- The prospect expects booking, quoting, payment, SMS, or CRM replacement.
