---
title: "feat: Add Cal.com Scheduling CTA To Demo Pages"
type: feat
status: active
date: 2026-06-06
origin: docs/brainstorms/2026-06-06-demo-cal-scheduling-cta-brainstorm.md
---

# feat: Add Cal.com Scheduling CTA To Demo Pages

## Context

The public demo page has an email correction path and Retell web-call CTA. Prospects also need a quick way to book a 30-minute call with Krish after trying the demo. The verified booking URL is `https://cal.com/your-handle/30min`.

## Acceptance Criteria

- [x] Public demo pages include a visible 30-minute scheduling CTA.
- [x] The CTA opens the shared founder booking URL in a new tab.
- [x] Existing email and Retell call behavior remains intact.
- [x] Styling matches the existing demo page design system.
- [x] Desktop and mobile layouts have no horizontal overflow or clipped primary controls.
- [x] Dashboard typecheck and build pass, or failures are documented.

## Implementation Notes

- Update `apps/dashboard/app/demo/[demoId]/page.tsx`.
- Update `apps/dashboard/app/demo/[demoId]/demo-client.tsx`.
- Update demo-specific styles in `apps/dashboard/app/globals.css`.
- Configure the shared URL with `NEXT_PUBLIC_FOUNDER_BOOKING_URL`, defaulting to `https://cal.com/your-handle/30min`.
- Do not introduce Cal.com secrets, API calls, iframe embeds, or calendar writeback.

## Verification

- `pnpm --filter @requesthandoff/dashboard typecheck`
- `pnpm --filter @requesthandoff/dashboard build`
- Browser QA on desktop and mobile for both active demos:
  - `https://requesthandoff.com/demo/sample-hvac-demo`
  - `https://requesthandoff.com/demo/sample-electrical-demo`

## Tasks

- [x] Add scheduling URL and CTAs.
- [x] Add responsive styles.
- [x] Run static verification.
- [x] Run Browser responsive QA.
