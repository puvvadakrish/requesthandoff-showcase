---
status: complete
priority: p1
issue_id: "002"
tags: [code-review, schema, webhook]
dependencies: []
---

# Commit Webhook Schema Columns

## Problem Statement

Commit `9209d96` uses tenant webhook fields in dashboard and post-call code, but the staged commit did not include the existing schema/migration changes that define those fields.

## Findings

- Dashboard reads/writes `outbound_webhook_url` and `outbound_webhook_secret_ciphertext`.
- Post-call expects `TenantConfigSchema` to accept `outbound_webhook_url` and runtime `outbound_webhook_secret`.
- `packages/schema/src/tenant.ts` and `supabase/migrations/0000_init.sql` were dirty in the worktree but not included in the commit.

## Proposed Solutions

### Option 1: Commit Existing Schema Changes

**Approach:** Stage the existing schema and migration changes that add webhook URL/ciphertext support.

**Pros:**
- Minimal.
- Aligns DB/schema with already-implemented runtime code.

**Cons:**
- Requires careful staging because those files also contain prior worktree changes.

**Effort:** Small

**Risk:** Low

## Recommended Action

Use Option 1 and verify package schema, dashboard, and post-call checks.

## Technical Details

**Affected files:**
- `packages/schema/src/tenant.ts`
- `supabase/migrations/0000_init.sql`

## Acceptance Criteria

- [x] `tenants` table includes outbound webhook URL and encrypted secret ciphertext columns.
- [x] `TenantConfigSchema` accepts webhook URL and runtime plaintext secret.
- [x] Relevant typecheck/build/tests pass.

## Work Log

### 2026-06-03 - Review Finding Created

**By:** Codex

**Actions:**
- Created from ce-review subagent finding.

**Learnings:**
- Dirty worktree state caused a partial commit that passed local checks but omitted required schema files.

### 2026-06-03 - Fixed

**By:** Codex

**Actions:**
- Included the existing schema and migration webhook columns in the fix commit.
- Ran schema, dashboard, and post-call verification.
