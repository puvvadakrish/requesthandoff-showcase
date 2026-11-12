---
title: Demo Cal.com Scheduling CTA
date: 2026-06-06
status: captured
---

# Demo Cal.com Scheduling CTA

## What We're Building

Add a direct 30-minute scheduling path to the public prospect demo pages so a business owner can either try the Retell call, email corrections, or book time with Krish from the same mobile-friendly page.

## Why This Approach

The demo page already proves the call experience and provides an email fallback. Scheduling is a founder-led conversion step, not an in-product calendar integration. The least risky path is to link the verified public Cal.com event type, `https://cal.com/your-handle/30min`, from the existing demo UI.

## Key Decisions

- Use one shared founder booking URL for all public demo links, configurable through `NEXT_PUBLIC_FOUNDER_BOOKING_URL`.
- Use the public Cal.com booking link, not a Cal.com API/MCP integration.
- Keep RequestHandoff's no-calendar-writeback boundary intact; the app does not book jobs or write to a prospect's calendar.
- Make scheduling available as a clear CTA beside the existing email correction path and as a dedicated follow-up panel.
- Preserve the Local Operator Premium design language already used by `/demo/[demoId]`.

## Open Questions

- None for this slice.
