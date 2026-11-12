---
status: complete
priority: p1
issue_id: "004"
tags: [code-review, security, webhook, ssrf]
dependencies: []
---

# Reject IPv6 Unspecified Webhooks

## Problem Statement

The webhook SSRF guard rejects IPv6 loopback, local, and link-local ranges, but not the unspecified address `::`.

## Findings

- `packages/outbound-webhook/src/index.ts` rejects `::1`, `fc*`, `fd*`, and `fe80:*`.
- `https://[::]/` can resolve locally on some platforms and should not be allowed as an outbound webhook target.

## Proposed Solutions

### Option 1: Treat `::` As Unsafe IPv6

**Approach:** Add `normalized === "::"` to the unsafe IPv6 check and add a regression test.

**Pros:**
- Minimal.
- Directly closes the bypass.

**Cons:**
- Does not address broader TOCTOU by itself.

**Effort:** Small

**Risk:** Low

## Recommended Action

Implement Option 1 together with the centralized request helper in issue 003.

## Technical Details

**Affected files:**
- `packages/outbound-webhook/src/index.ts`
- `packages/outbound-webhook/src/index.test.ts`

## Acceptance Criteria

- [x] `https://[::]/...` is rejected.
- [x] Resolved `::` addresses are rejected.

## Work Log

### 2026-06-03 - Review Finding Created

**By:** Codex

**Actions:**
- Created from ce-review subagent finding.

### 2026-06-03 - Fixed

**By:** Codex

**Actions:**
- Added `::` to unsafe IPv6 handling.
- Added regression coverage for `https://[::]/...`.
