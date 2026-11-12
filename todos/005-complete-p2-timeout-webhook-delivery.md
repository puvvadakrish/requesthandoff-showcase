---
status: complete
priority: p2
issue_id: "005"
tags: [code-review, reliability, webhook]
dependencies: []
---

# Timeout Webhook Delivery

## Problem Statement

Webhook test delivery and production post-call delivery can wait on external endpoints without an explicit timeout. Production delivery also retries synchronously in the post-call request path.

## Findings

- Dashboard test delivery uses external POST without an abort timeout.
- Post-call webhook delivery is awaited before the worker response returns.
- Default webhook retry/backoff behavior can hold a worker request longer than needed after baseline email delivery.

## Proposed Solutions

### Option 1: Add Explicit Request Timeout And Shorten MVP Retry

**Approach:** Add timeout support to the shared webhook client and reduce the default webhook delivery retry envelope for MVP.

**Pros:**
- Bounds dashboard and worker latency.
- Keeps retry behavior without long request blocking.

**Cons:**
- Failed endpoints may need operational retry/backoff later.

**Effort:** Small

**Risk:** Low

## Recommended Action

Implement Option 1 now; consider queue-backed webhook retries later if delivery reliability needs grow.

## Technical Details

**Affected files:**
- `packages/outbound-webhook/src/index.ts`
- `services/post-call/src/delivery/webhook-url.ts`
- `services/post-call/src/app.ts`
- Dashboard settings actions

## Acceptance Criteria

- [x] Dashboard test delivery has an explicit timeout.
- [x] Production webhook delivery has an explicit timeout.
- [x] Production post-call webhook retry envelope is bounded.

## Work Log

### 2026-06-03 - Review Finding Created

**By:** Codex

**Actions:**
- Created from ce-review subagent finding.

### 2026-06-03 - Fixed

**By:** Codex

**Actions:**
- Added 8-second timeout support to the shared webhook request helper.
- Used the timeout in dashboard test delivery and post-call production delivery.
- Reduced default post-call webhook attempts from 5 to 2 for the MVP synchronous path.
