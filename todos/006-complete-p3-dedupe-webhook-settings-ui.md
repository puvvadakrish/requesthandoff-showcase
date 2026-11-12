---
status: complete
priority: p3
issue_id: "006"
tags: [code-review, quality, dashboard]
dependencies: []
---

# Dedupe Webhook Settings UI

## Problem Statement

Founder-admin and owner settings pages duplicate the webhook form, status notice, styles, and test-delivery affordance.

## Findings

- Admin page and owner page repeat the same inputs and helper copy.
- Admin and owner actions share similar save/test structure.
- This is not a blocker, but future validation/copy changes could drift.

## Proposed Solutions

### Option 1: Shared Server Component

**Approach:** Extract a reusable webhook settings form component that accepts action handlers, field defaults, and copy variations.

**Pros:**
- Reduces drift.
- Keeps visual behavior consistent.

**Cons:**
- Adds abstraction before there are many settings surfaces.

**Effort:** Small

**Risk:** Low

## Recommended Action

Implemented Option 1 after P1/P2 blockers were resolved.

## Technical Details

**Affected files:**
- `apps/dashboard/app/(admin)/tenants/[tenantId]/edit/page.tsx`
- `apps/dashboard/app/(owner)/settings/page.tsx`

## Acceptance Criteria

- [x] Shared UI component covers common webhook URL/secret/test controls.
- [x] Admin and owner surfaces can still customize headings and button labels.

## Work Log

### 2026-06-03 - Review Finding Created

**By:** Codex

**Actions:**
- Created from ce-review subagent finding.

### 2026-06-03 - Implemented

**By:** Codex

**Actions:**
- Extracted `OutboundWebhookSettingsForm` as a shared server component.
- Updated founder-admin and owner settings pages to pass route-specific actions, labels, and button colors.

**Learnings:**
- The auth and data-loading code should remain separate; only the presentation/control surface needed deduping.
