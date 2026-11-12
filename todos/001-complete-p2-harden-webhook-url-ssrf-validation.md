---
status: complete
priority: p2
issue_id: "001"
tags: [security, webhook, ssrf]
dependencies: []
---

# Harden Webhook URL SSRF Validation

## Problem Statement

U20 validates outbound webhook URLs before founder-admin save and before delivery, but the current guard is textual only. That is acceptable for the current founder-only writer, but it should be hardened before webhook settings become owner-editable.

## Findings

- `packages/outbound-webhook/src/index.ts` rejects non-HTTPS URLs, localhost-style hostnames, literal private IPv4 ranges, and basic loopback/link-local IPv6.
- The guard does not resolve hostnames and re-check resolved addresses, so DNS rebinding or a public-looking hostname that resolves to a private/cloud metadata IP could bypass textual checks.
- Redirect targets are not revalidated. Node fetch follows redirects by default, so a safe URL can redirect to an unsafe URL.
- Alternate IP encodings and IPv4-mapped IPv6 should be covered by tests before owner-editable webhook URLs ship.

## Proposed Solutions

### Option 1: Resolve And Validate Before Send

**Approach:** Resolve webhook hostnames in the outbound webhook helper, reject private/link-local/loopback resolved IPs, set `redirect: "manual"`, and validate each redirect hop before following.

**Pros:**
- Centralizes safety for admin test delivery and post-call delivery.
- Preserves generic webhook handoff while reducing SSRF risk.

**Cons:**
- Requires careful implementation around DNS lookup, IPv6, and redirect limits.

**Effort:** 2-4 hours

**Risk:** Medium

---

### Option 2: Restrict To Approved Webhook Domains

**Approach:** Allow only known providers such as Zapier, Make, and n8n Cloud until owner-editable URLs are needed.

**Pros:**
- Simple operationally.
- Strong SSRF reduction.

**Cons:**
- Weakens RequestHandoff's integration-neutral positioning for custom webhooks.

**Effort:** 1-2 hours

**Risk:** Low

## Recommended Action

Implemented Option 1 before adding the owner-editable settings page. The shared outbound webhook helper now resolves hostnames and both admin/owner test delivery plus post-call fetches use manual redirects.

## Technical Details

**Affected files:**
- `packages/outbound-webhook/src/index.ts`
- `packages/outbound-webhook/src/index.test.ts`
- `apps/dashboard/lib/admin/outbound-webhook-settings.ts`
- `services/post-call/src/delivery/webhook-url.ts`

**Related components:**
- Founder-admin webhook test delivery
- Post-call webhook delivery
- Future owner-facing settings route

## Resources

- U20 Claude review finding: textual SSRF validation is non-blocking while founder-only, but must be hardened before owner-editable webhook URLs.

## Acceptance Criteria

- [x] Hostnames are resolved and all resolved IPs are checked against private, loopback, link-local, and metadata-sensitive ranges.
- [x] Redirects are manual or each redirect hop is validated before following.
- [x] Tests cover hostname-to-private-IP resolution, alternate IP encodings, IPv4-mapped IPv6, and redirect-to-unsafe-target behavior.
- [x] Admin test delivery and post-call delivery both inherit the hardened guard.

## Work Log

### 2026-06-03 - Review Follow-Up Created

**By:** Codex

**Actions:**
- Tracked a non-blocking U20 review finding from Claude CLI.
- Kept U20 scoped to founder-admin webhook settings instead of broadening into owner-editable webhook hardening.

**Learnings:**
- The current URL guard is defense-in-depth for founder-admin settings.
- Owner-editable webhook settings need resolved-IP and redirect-aware validation before shipping.

### 2026-06-03 - Implemented

**By:** Codex

**Actions:**
- Added resolved-host validation to `packages/outbound-webhook/src/index.ts`.
- Set admin test delivery and post-call webhook fetches to `redirect: "manual"`.
- Added owner-facing `/settings` only after the shared guard covered owner-editable URLs.
- Added tests for alternate IP encodings, IPv4-mapped IPv6, and hostname resolution to private IPs.

**Learnings:**
- Keeping the guard in `@requesthandoff/outbound-webhook` lets founder admin, owner settings, and post-call delivery inherit the same safety checks.
