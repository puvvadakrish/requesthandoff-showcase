---
status: active
created: 2026-05-04
source: apps/dashboard/app/page.tsx
---

# RequestHandoff Design System

This is the canonical visual direction for RequestHandoff.com and the RequestHandoff product UI going forward.

The selected direction is **Local Operator Premium**: grounded, local, practical, warm, and operationally credible. It should feel like a serious tool for small home-service owners, not a generic AI SaaS product and not an enterprise dispatch suite.

## Decision

Use Variant A as the core brand and product design system.

- Main route: `/`
- Primary font: Plus Jakarta Sans
- Core palette: warm paper, pine green, clay/rust accent, muted field green, soft gold
- Imagery: real HVAC / field-service / local-operator photography
- Tone: trustworthy, owner-operator friendly, premium but not precious

Keep Variant B and Variant C only as supporting pattern references:

- Variant B, Dispatch Console: use for dashboard tables, lead queues, logs, delivery proof, and product UI surfaces.
- Variant C, Missed Revenue Audit: use for outbound campaign pages, audit reports, revenue proof sections, and high-conversion CTAs.

## Design Principles

1. Lead with outcomes, not AI.
   The interface should make the product feel like call coverage and lead handoff, not like a chatbot wrapper.

2. Feel local before feeling technical.
   The buyer is an Austin owner-operator. Use imagery, language, and spatial rhythm that feel grounded in home-service work.

3. Make trust visible.
   Flat-rate pricing, no escalation fees, no CRM lock-in, and business-defined escalation rules should appear as concrete UI proof, not abstract claims.

4. Use product UI as evidence.
   Lead cards, handoff logs, delivery destinations, and weekly ROI reports are the proof objects. Avoid generic dashboard decoration.

5. Keep density matched to context.
   Marketing pages can be spacious and image-led. Dashboard screens should be tighter and more scannable, borrowing from the Dispatch Console direction.

## Typography

### Primary Brand Font

Use `Plus Jakarta Sans` for the main website and general product UI.

Current token:

```css
--rh-font-brand: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
```

Use large, confident headings with tight but readable line-height. Do not use negative letter spacing globally. Do not use Inter as the brand font.

### Operational UI Font

Use `IBM Plex Sans` and `IBM Plex Mono` for dense dashboard and log surfaces.

Current tokens:

```css
--rh-font-console: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
--rh-font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

Use monospace for timestamps, call counts, latency, usage, and delivery status numbers.

### Audit Campaign Font

Use `Archivo` + `Work Sans` only for missed-call audit campaign pages and revenue-report sections where the tone should be more direct-response.

Current tokens:

```css
--rh-font-audit-display: "Archivo", ui-sans-serif, system-ui, sans-serif;
--rh-font-audit-body: "Work Sans", ui-sans-serif, system-ui, sans-serif;
```

## Color System

Canonical tokens live in `apps/dashboard/app/design-tokens.css`.

```css
--ink: #10201d;
--muted: #60716a;
--line: #d9ded4;
--paper: #f5f1e6;
--paper-strong: #fff9eb;
--field: #dae7d6;
--accent: #bd5538;
--accent-dark: #843421;
--pine: #153c31;
--gold: #d8ad63;
```

Usage:

- `paper`: default site background.
- `ink`: primary text and dark buttons.
- `muted`: supporting copy and metadata.
- `pine`: trust bands, pricing sections, and brand mark.
- `accent`: primary CTA and key conversion emphasis.
- `gold`: sparingly, for premium highlights or dark-surface labels.
- `line`: dividers and low-emphasis borders.

Avoid:

- Purple/blue AI gradients.
- Neon glows.
- All-beige layouts with no contrast.
- Pure black backgrounds.
- Overusing rust/orange so the brand reads like a home-improvement coupon site.

## Shape, Spacing, And Surfaces

Tokens:

```css
--rh-radius-sm: 0.35rem;
--rh-radius-md: 0.45rem;
--rh-radius-pill: 999px;
--rh-section-x: clamp(1rem, 4vw, 3.5rem);
--rh-section-y: clamp(4.5rem, 9vw, 8rem);
--rh-hero-y: clamp(4rem, 8vw, 7rem);
```

Rules:

- Use small radii. Cards should feel utilitarian and solid, not soft SaaS blobs.
- Use full-width sections and bands. Do not nest cards inside cards.
- Use generous section spacing on marketing pages.
- Use tighter rhythm and table/list separation in dashboard surfaces.
- Prefer borders and spatial grouping over heavy shadows. Shadows are acceptable for lead-card proof objects.

## Imagery

Primary imagery should show real work, local operations, service equipment, or field-service context.

Good:

- HVAC technician inspecting equipment.
- Service van, shop, dispatch desk, phone handoff context.
- Owner/operator in a real work environment.
- Crops that reveal the product context clearly.

Bad:

- Abstract AI art.
- Blurred phone/chatbot stock images.
- Generic corporate office scenes.
- Dark atmospheric images where the service context is unreadable.

Current approved image URLs used in prototypes:

- HVAC technician hero: `https://images.pexels.com/photos/32497161/pexels-photo-32497161.jpeg`
- Field/ops console reference: `https://images.pexels.com/photos/4489734/pexels-photo-4489734.jpeg`
- Audit/service portrait reference: `https://images.pexels.com/photos/4489794/pexels-photo-4489794.jpeg`

When possible, replace these with owned or properly licensed Austin-area photography before launch.

## Core Components

### Brand Mark

Use the compact `RH` mark for now:

- Pine background on canonical pages.
- Gold-on-dark variant for console UI.
- Rust-on-cream variant for audit campaign pages.

Do not over-design the logo until the product positioning is validated with real owners.

### Buttons

Primary CTA:

- Rust/clay background.
- Light text.
- Pill radius.
- Strong weight.
- Active state uses subtle press transform.

Secondary CTA:

- Transparent background.
- Thin border.
- Ink text.

Do not use icon-only CTAs for primary marketing actions.

### Lead Card

The lead card is the main proof object. It should show:

- Captured timestamp.
- Service issue.
- Caller / location.
- Urgency decision.
- Handoff destination.

Use it anywhere we need to prove "structured leads, not transcripts."

### Trust Strip

Use short, concrete trust claims:

- No escalation fees, ever.
- Built in Austin for Austin operators.
- Works with your current dispatch tool.

Avoid abstract trust language like "secure, scalable, seamless."

### Pricing Cards

Pricing should preserve the flat-rate promise:

- Show plan price clearly.
- Show included calls.
- State overage plainly.
- State "Escalations are never a surcharge."

Never add hidden escalation, per-minute, or urgent-transfer fees.

## Accessibility And Responsiveness

- All pages must work as single-column layouts under tablet widths.
- Text must not overlap cards or imagery.
- Buttons must remain legible at mobile widths.
- Use actual text for key claims, not text baked into images.
- Maintain contrast on image overlays.
- Avoid animations that are required to understand the page.

## Canonical Files

- Tokens: `apps/dashboard/app/design-tokens.css`
- Current homepage: `apps/dashboard/app/page.tsx`
- Global styles: `apps/dashboard/app/globals.css`
- Page patterns: `docs/design/requesthandoff-page-patterns.md`
