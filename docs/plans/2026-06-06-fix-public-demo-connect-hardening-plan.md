---
title: Public Demo Connect Hardening Plan
date: 2026-06-06
status: in-progress
branch: codex/demo-scheduling-cta
---

# Public Demo Connect Hardening Plan

## Context

PR #1 is build-green, but review found the public Retell web-call token route was not yet enforcing all U22 abuse controls. The route must be hardened before merging because it creates live Retell web-call sessions from an unauthenticated public URL.

## Work Items

1. Add durable public-demo attempt tracking.
   - Add `demo_session_attempts` with hashed IP, Turnstile status, success flag, Retell call id, and timestamp.
   - Keep RLS enabled with no public table policy.

2. Move public demo preview reads to RLS.
   - Add an anon read policy for approved, unexpired demo previews.
   - Use the existing RLS Supabase server adapter from the public demo page.

3. Harden `/api/demo/[demoId]/connect`.
   - Verify Cloudflare Turnstile before reading/reserving the session when configured.
   - Fail closed in production if Turnstile is not configured.
   - Enforce one attempt per hashed IP per demo per 60 minutes.
   - Enforce the configured monthly demo budget using successful attempt count.
   - Reserve session count before calling Retell and roll back on provider failure.
   - Return generic public provider errors.
   - Send a best-effort founder Slack alert after successful Retell token issuance.

4. Add focused tests.
   - Cover IP extraction/hashing stability.
   - Cover budget pause math.
   - Cover production Turnstile configuration behavior.

5. Verify and review.
   - Run focused dashboard tests.
   - Run dashboard typecheck and build.
   - Rerun reviewer pass before merge.

## Done Evidence

- Added `demo_session_attempts` for hashed-IP attempt tracking and monthly demo budget checks.
- Added anon RLS read policy for approved, unexpired demo previews.
- Moved `/demo/[demoId]` preview reads from service-role Supabase to the RLS Supabase adapter.
- Hardened `/api/demo/[demoId]/connect` with Turnstile verification, per-IP attempt limit, monthly budget pause, pre-Retell session reservation, provider rollback, generic public provider errors, and best-effort founder Slack alerts.
- Added focused guard tests in `apps/dashboard/lib/demo/connect-guards.test.ts`.
- Verification on 2026-06-06:
  - `pnpm --filter @requesthandoff/dashboard test` passed, 13 tests.
  - `pnpm --filter @requesthandoff/dashboard typecheck` passed.
  - `pnpm --filter @requesthandoff/dashboard lint` passed.
  - `pnpm --filter @requesthandoff/dashboard build` passed.
