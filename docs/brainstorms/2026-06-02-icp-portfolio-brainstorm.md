---
date: 2026-06-02
topic: icp-portfolio
---

# Ideal Customer Profile Expansion Brainstorm

## What We're Building

We are not replacing the current RequestHandoff beachhead. Austin-area home/property service owner-operators remain the launch wedge because they have urgent, high-intent phone demand, clear missed-call ROI, and comparatively simple handoff destinations. What we are adding is an ICP map that separates the **launch ICP**, **near-adjacent ICPs**, and **watchlist ICPs** so future planning does not accidentally treat one narrow wedge as the entire business.

The core question is: where else does RequestHandoff's promise hold true — every call covered, every lead captured, delivered where you already work — without forcing us into calendar booking, payments, regulated intake, or system-of-record replacement too early?

## Why Ideate Beyond One ICP

The current strategy is intentionally narrow, but the product primitive is broader than HVAC: phone-first local businesses lose revenue when they miss calls, and many do not want a new CRM. Recent market pages and buyer discussions show AI receptionist positioning is increasingly crowded across home services, appointment businesses, and small local services. That means narrow positioning is useful for launch, but overly narrow strategy could hide better subsegments with faster sales cycles, easier onboarding, or less incumbent pressure.

The key is not to become “AI receptionist for everyone.” The right expansion frame is **integration-neutral call handoff for owner-operated local businesses where missed calls have measurable value and the business already has a destination for the lead**.

## ICP Scoring Criteria

Score each ICP on these dimensions before planning work:

- **Missed-call pain:** Does the owner visibly lose money when calls go unanswered?
- **Lead value:** Can one captured lead/order justify the monthly price?
- **Call standardization:** Can intake be scripted without too many exceptions?
- **Urgency / routing value:** Is there a useful escalation or prioritization decision?
- **Integration simplicity:** Can the handoff land in an MVP-safe destination like email, webhook, Jobber, or spreadsheet without deep custom work? If the segment needs SMS, calendar, or POS write-back to feel useful, score this lower and treat it as expansion risk.
- **Compliance risk:** Are calls likely to involve PHI, legal privilege, financial advice, children, or vulnerable adults?
- **GTM reachability:** Can we identify and contact owners locally or through directories?
- **Competitive pressure:** Are vertical incumbents already strong enough to make differentiation expensive?

## Recommended ICP Portfolio

### 1. Launch ICP — Home / Property Service Owner-Operators

**Examples:** HVAC, electrical, plumbing later, garage door, pest control, pool service, appliance repair, handyman, roofing after storm season validation.

**Why it fits:** High-intent calls, urgent routing, high job value, familiar field-service tools, and strong fit with flat-rate trust. This remains the best launch wedge.

**Watchouts:** HVAC/plumbing AI receptionist competition is noisy in 2026. Phone plumbing and call-forwarding setup may stall deals more than the demo. Vertical depth must feel real, not generic.

**Decision:** Keep as primary ICP, but describe it as the wedge, not the whole company.

### 2. Near-Adjacent ICP — Mobile / Vehicle Service Shops

**Examples:** mobile detailing, tint/wrap/PPF shops, auto repair, tire/mobile mechanic, windshield repair.

**Why it fits:** Phone-driven demand, high-ticket jobs, owner-operated workflows, strong service-menu qualification, and often simple handoff into email, webhook, or an existing work queue. Some emerging competitors are already verticalizing here, which validates demand but argues for fast positioning if chosen.

**Risks:** More scheduling-heavy than HVAC; may need deposits, vehicle fields, bay/provider availability, or quote workflows.

**Decision:** First adjacent discovery sprint. This segment is closest to RequestHandoff's structured handoff thesis: the owner is often busy/on-site, calls are high-intent, required fields are concrete, and one captured job can justify the monthly price. Keep appointment-based operators as a comparison lane, not the first expansion bet.

### 3. Near-Adjacent ICP — Appointment-Based Local Operators

**Examples:** barbers, salons, pet groomers, massage, wellness studios, trainers.

**Why it fits:** Calls are repetitive, owners are interrupted, and missed booking/reschedule calls hurt utilization.

**Risks:** The product promise changes from “structured lead handoff” to “calendar booking/rescheduling,” which is explicitly out of MVP scope. Provider-specific availability and cancellation rules add complexity fast.

**Decision:** Keep as a later segment unless we deliberately build calendar-first capabilities.

### 4. Watchlist ICP — Restaurants / Takeout-Heavy Local Food

**Examples:** independent restaurants with high phone-order volume, catering-heavy shops, multi-location takeout operators.

**Why it fits:** Missed calls cluster during peak rush when callers have immediate purchase intent. The ROI can be obvious if the call becomes an order.

**Risks:** This is not lead handoff; it is order capture. POS/kitchen ticket integration becomes the system-of-record problem we are trying to avoid. The operational burden differs from RequestHandoff's current name and wedge.

**Decision:** Watch closely, but do not plan until/unless we create a separate “order handoff” strategy.

### 5. Watchlist ICP — Professional Services

**Examples:** law firms, tax preparers, insurance agencies, real estate teams, property managers.

**Why it fits:** High lead value and intake qualification matter.

**Risks:** Privacy, compliance, trust expectations, and intake nuance are much higher. Human fallback may be expected. Legal/financial claims can create liability.

**Decision:** Defer until after compliance and failure-mode docs exist.

### 6. Avoid For Now — Health, Care, Children, Seniors

**Examples:** home care, childcare, medical/dental, therapy, senior care.

**Why it fits:** High phone demand and high value.

**Why to avoid now:** PHI, safety, consent, licensing, emergency routing, and trust concerns are too heavy for MVP. This segment may require BAA posture and human escalation guarantees.

**Decision:** Explicitly out of scope until RequestHandoff has mature compliance, monitoring, and fallback operations.

## Key Decisions

- **Keep the launch wedge narrow:** Austin home/property services remains the first ICP because it best matches current strategy, code, design, and GTM artifacts.
- **Broaden the strategic map:** Document adjacent ICPs so future planning can compare opportunities instead of defaulting to HVAC forever.
- **Do not broaden MVP scope:** ICP expansion is a discovery and positioning exercise, not permission to add calendars, POS, SMS, payments, or regulated intake now.
- **Use “handoff fit” as the filter:** The best segments have valuable calls and a simple destination for structured handoff.
- **Treat restaurants as a separate product thesis:** They may have strong missed-call pain, but order capture is materially different from lead handoff.
- **Defer regulated trust markets:** Professional, medical, family, and care services need compliance and failure-mode docs first.

## Open Questions

(Resolved in this pass. See Resolved Questions.)

## Resolved Questions

1. **Which adjacent ICP gets first discovery?** Mobile/vehicle appearance and service shops: detail, tint, wrap, ceramic, PPF, windshield repair, and mobile mechanic. Appointment-based operators remain the comparison lane.
2. **Should strategy say launch wedge?** Yes. `STRATEGY.md` should eventually clarify that home/property services are the launch wedge, while the broader company thesis is integration-neutral call coverage and structured handoff for owner-operated local service businesses.
3. **What evidence promotes an adjacent ICP?** Require 8–10 interviews, 3+ operators confirming missed calls as lost revenue, 2+ with simple handoff destinations, 1 paid or serious design partner, and no requirement for calendar writes, deposits, POS, regulated intake, or system-of-record replacement.

## Suggested Discovery Plan

Run a two-week discovery sprint alongside, not instead of, the Austin home-service launch:

- Interview or cold-message 5 home/property operators to validate the current wedge.
- Interview 8–10 mobile/vehicle service shops to test whether handoff is simple and high-value.
- Interview 3 appointment-based operators as a comparison lane to measure calendar complexity.
- Collect exact missed-call language, current phone setup, current destination tool, average lead/order value, and willingness to pay.
- Do not build new vertical code until one adjacent ICP produces a clear design partner or stronger conversion signal than the current wedge.

## Source Notes

- Current internal strategy: `STRATEGY.md`, `GTM-PLAYBOOK.md`, and `docs/PRD.md`.
- 2026 market scan found continued home-service AI receptionist crowding and verticalization, plus adjacent activity in appointment and auto/detailing niches.
- Relevant external examples reviewed: [DialPhone 2026 small-business guide](https://www.dialphone.com/resources/blog/ai-receptionist-for-small-business), [TheChattyAI 2026 home-services report](https://thechattyai.com/research), [Wrench Dispatch](https://www.wrenchdispatch.com/), [PickupBell](https://www.pickupbell.com/), [Booklee](https://booklee.io/), [Magic Voice](https://www.getmagicvoice.com/), [GlossFlow AI](https://glossflowai.com/), [AutoJoy](https://www.autojoy.ai/), [EchoDesk](https://echodesk.us/), [Trimpulse](https://trimpulse.ai/), and recent AI receptionist buyer discussions on Reddit.

## Next Steps

→ Add an ICP map or “launch wedge vs expansion ICPs” section to `STRATEGY.md` only after founder approval.
→ Create an owner-interview script that compares home services against one adjacent ICP.
→ Keep current implementation planning focused on the existing MVP unless discovery changes the strategy.
