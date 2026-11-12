---
title: Public Demo Connect Hardening Brainstorm
date: 2026-06-06
status: accepted
scope: PR #1 public demo call path
---

# Public Demo Connect Hardening Brainstorm

## Goal

Make the public `/demo/<id>` call path safe enough to send to two local prospects without turning RequestHandoff into a self-serve demo system.

The demo remains founder-led. The prospect can listen to a short personalized call, email corrections, or book a 30-minute walkthrough. The call agent is the shared Retell demo agent with business facts injected at runtime, not a per-prospect production agent.

## Constraints

- Keep the first-logo playbook intact: no production forwarding, no booking, no quoting, no payments, no CRM replacement.
- Do not create one Retell agent per prospect.
- Do not leak service-role access into owner-facing product routes.
- Do not issue a Retell web-call token until abuse controls pass.
- Keep controls understandable enough for founder-operated demos.

## Options Considered

### A. Merge after green CI

Green CI proves the code builds, but it does not prove the public Retell route is safe. This leaves a real spend and abuse gap.

Decision: reject.

### B. Disable "Try the call" and use scheduling only

This removes the risk but also removes the point of the personalized demo. The outreach gets weaker and no longer shows the actual call experience.

Decision: reject.

### C. Add narrow public-demo guardrails now

Use the controls already named in plan U22:

- Cloudflare Turnstile on the connect button when configured.
- Hashed-IP attempt table with one attempt per demo per 60 minutes.
- Existing per-demo max-session cap.
- Existing founder approval and expiry gates.
- Monthly demo-session budget pause based on successful demo attempts.
- Best-effort founder Slack alert after token issuance.

Decision: accept.

## Service Boundary Decision

The public demo page can read approved, unexpired demo previews through RLS. The connect route still needs privileged mutation because it reserves sessions, records abuse-control attempts, and rolls back failed Retell provider calls atomically from the server. That service-role use must stay confined to `apps/dashboard/app/api/demo/[demoId]/connect/route.ts` and be guarded before Retell token issuance.

## Acceptance Criteria

- Public demo page no longer imports the service-role client.
- Connect route verifies Turnstile before Retell when configured.
- Connect route rate-limits by hashed IP and demo id.
- Connect route checks budget before issuing a Retell token.
- Connect route reserves the session before calling Retell and rolls back if Retell fails.
- Founder gets a best-effort Slack alert on a successful demo call start.
- CI, dashboard typecheck, dashboard build, and focused tests pass.
