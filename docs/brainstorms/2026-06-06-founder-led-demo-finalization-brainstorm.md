---
date: 2026-06-06
topic: founder-led-demo-finalization
---

# Founder-Led Demo Finalization

## What We're Preparing

RequestHandoff needs to be ready for a founder-led demo with one small-business prospect tomorrow. The demo should show the actual product loop: a business-specific public preview, a Retell-backed call path, structured lead extraction, and email handoff delivery.

This is not a production live pilot. Production call forwarding remains gated by `docs/operations/first-live-pilot-runbook.md`.

## Demo-Critical Surface

- Public website loads at both `requesthandoff.com` and `www.requesthandoff.com`.
- Approved public demo link loads business-specific facts and handoff boundaries.
- Demo connect endpoint issues a Retell web-call token for the approved demo session.
- Retell webhook reaches the Render voice service.
- Voice service forwards completed calls to the post-call worker.
- Post-call worker extracts a structured lead with Gemini and sends email through Brevo.
- Supabase stores call, lead, and delivery rows so the founder can verify the handoff.

## Key Decisions

- Use `gemini-3.5-flash` as the primary post-call extraction model, with `gemini-3-flash-preview` as a fallback for transient high-demand errors.
- Use the Gemini API-key path for Render; do not require Vertex/GCP service-account JSON for tomorrow.
- Increase the voice-to-post-call forwarding timeout from 8 seconds to 20 seconds because Gemini plus email delivery can exceed 8 seconds while still succeeding.
- Add an executable readiness harness so the founder can rerun the hosted checks before leaving for the client.
- Keep the talk track handoff-only: structured leads into the operator's existing workflow, no booking, quote, payment, SMS, or CRM replacement.

## No-Go Boundaries

- Do not enable production call forwarding until the live-pilot runbook gates pass.
- Do not show this as a native CRM integration.
- Do not promise calendar booking, quoting, payment, SMS, or dispatch replacement.
- Do not expand outside Texas or regulated intake for the first production pilot.
- Do not use first calls in marketing without explicit permission.

## Success Criteria

- `pnpm demo:readiness` passes.
- Dashboard build and service tests pass.
- Hosted demo page returns a Retell web-call token.
- Founder has a crisp morning script and rollback/no-go boundaries.
