---
status: complete
priority: p1
issue_id: "003"
tags: [code-review, security, webhook, ssrf]
dependencies: []
---

# Close Webhook SSRF TOCTOU Gap

## Problem Statement

Webhook URL validation currently resolves and validates a hostname before a later `fetch()` call performs its own DNS lookup. A hostile hostname can pass validation with a public IP and then resolve to a private IP for the actual request.

## Findings

- `assertResolvedSafeWebhookUrl` validates a lookup result.
- Admin test delivery, owner test delivery, and post-call delivery then call ordinary `fetch()` by URL.
- This creates a DNS rebinding time-of-check/time-of-use gap.

## Proposed Solutions

### Option 1: Centralized Node HTTPS Client With Validated Lookup

**Approach:** Add a shared outbound webhook POST helper that validates resolved addresses and performs the request using a custom `lookup` callback pinned to the validated address.

**Pros:**
- Centralizes request policy.
- Removes separate fetch DNS lookup.
- Supports explicit timeout.

**Cons:**
- More code than fetch.

**Effort:** Medium

**Risk:** Medium

## Recommended Action

Implement Option 1 in `@requesthandoff/outbound-webhook` and use it from dashboard test delivery and post-call delivery.

## Technical Details

**Affected files:**
- `packages/outbound-webhook/src/index.ts`
- `apps/dashboard/app/(admin)/tenants/[tenantId]/edit/actions.ts`
- `apps/dashboard/app/(owner)/settings/actions.ts`
- `services/post-call/src/app.ts`

## Acceptance Criteria

- [x] Actual webhook request uses a validated resolved address, not a second uncontrolled DNS lookup.
- [x] Redirects are not followed automatically.
- [x] Tests cover lookup pinning and private-IP rejection.

## Work Log

### 2026-06-03 - Review Finding Created

**By:** Codex

**Actions:**
- Created from ce-review subagent finding.

**Learnings:**
- Save-time validation is insufficient when the send path performs another independent DNS lookup.

### 2026-06-03 - Fixed

**By:** Codex

**Actions:**
- Added a shared Node HTTPS webhook POST helper with a custom lookup pinned to the validated resolved IP.
- Replaced dashboard and post-call direct webhook `fetch()` calls with the shared helper.
