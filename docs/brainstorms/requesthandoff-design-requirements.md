---
date: 2026-05-03
topic: requesthandoff-design-requirements
---

# RequestHandoff MVP — Technical Design Requirements

## Summary

A solo-built MVP, shipping in 8–12 weeks, runs as a hybrid orchestration architecture: Retell AI handles every live phone call, our Render-hosted backend (Virginia, US East — co-located with Supabase Postgres in AWS `us-east-1`) owns the per-vertical playbooks and answers Retell's mid-call function calls in <150ms, and a post-call pipeline on Vertex AI Gemini 3 Flash extracts structured leads that are delivered into the customer's existing tools (or via email) — never into our dashboard as a system of record.

---

## Problem Frame

Owner-operators in Austin home services lose 27–40% of inbound calls to voicemail every week, and 85% of those callers dial a competitor instead of leaving a message. Existing AI receptionists either bill-shock with per-call escalation fees, lock owners into a single CRM, or (in the case of Avoca and ServiceTitan's bundled voice agent) want to *be* the dispatch system. STRATEGY.md commits RequestHandoff to two structural differentiators that no incumbent owns cleanly: flat-rate pricing with no escalation surcharges, and integration-neutral handoff into whatever tool the business already uses.

The technical design has to encode those two commitments into the architecture itself — not as features that can be quietly traded away under shipping pressure. A solo founder shipping in 8–12 weeks cannot afford a custom voice runtime, but cannot afford to be a thin wrapper around Retell either: the per-tenant playbook layer and the lead-delivery layer have to live in code we own so the integration-neutral wedge survives a future runtime swap.

---

## Actors

- A1. **Caller** — A homeowner or commercial customer phoning a RequestHandoff-protected business line. Wants service, pricing, scheduling, or emergency response. Does not know they're talking to AI.
- A2. **Owner-operator** — The HVAC or plumbing business owner. Receives urgent escalations as inbound calls from the agent and lead summaries by email. White-glove onboarding partner for the first 50 logos.
- A3. **Voice agent (Retell)** — The live conversational layer. Handles audio, STT, TTS, barge-in, and tool/function calling; produces transcripts and call events.
- A4. **Voice hot-path service** — Our always-on Render Web Service (Virginia) answering Retell's mid-call function calls (`check_hours`, `check_service_area`, `request_schedule_window`, `escalate_now`).
- A5. **Post-call worker** — A Render Background Worker triggered by Retell's `call_ended` webhook; extracts the structured lead, delivers it to integrations, runs retry-with-backoff for failed deliveries.
- A6. **Dashboard** — Next.js web app where the owner reviews leads, marks status, configures escalation rules, and views the weekly ROI report.
- A7. **Founder (Krish, MVP only)** — The white-glove onboarding partner for the first 50 logos. Sets up each tenant's profile alongside the owner during a kickoff call.

---

## Key Flows

- F1. **Inbound call → captured lead (happy path)**
  - **Trigger:** Caller dials the business's main line; the line is forwarded to a Retell-provisioned DID.
  - **Actors:** A1, A3, A4, A5
  - **Steps:** Retell answers with the per-tenant greeting → runs the vertical-specific qualification playbook → makes function calls to the hot-path service for hours/service-area/scheduling decisions → ends the call → fires `call_ended` webhook → post-call pipeline extracts structured lead via Gemini 3 Flash → fans out delivery to email + any configured integrations.
  - **Outcome:** Owner has a structured lead in their inbox (and in Jobber/HCP if integrated) within ~60 seconds of the caller hanging up.
  - **Covered by:** R1, R2, R6, R8, R12, R15, R17

- F2. **Urgent call → live owner bridge**
  - **Trigger:** During F1, the agent detects business-defined urgency criteria (per-vertical rule fires).
  - **Actors:** A1, A3, A4, A2
  - **Steps:** Agent invokes `escalate_now` mid-call → hot-path service confirms escalation policy and returns the owner's phone number + warm-transfer prompt → Retell places an outbound call to the owner → on owner pickup, agent briefs them in 1 sentence ("urgent call from a homeowner with a burst pipe") → bridges the caller in → pipeline still produces a lead summary marked `urgent: escalated`.
  - **Outcome:** Owner is on the line with the caller within 90 seconds of the urgency trigger; the lead record reflects the escalation and its outcome.
  - **Covered by:** R10, R11, R13, R14, AE2, AE3

- F3. **Onboarding (white-glove for first 50 logos — demo-IS-kickoff model)**
  - **Trigger:** Cold-outreach prospect agrees to a single consolidated call (no separate kickoff). Updated 2026-05-04: the original "30-min kickoff call after demo" model is replaced by a single 30–40 min call where demo and kickoff merge.
  - **Actors:** A7, A2, A6
  - **Steps:** Before the call: founder runs the pre-demo extractor (~5 min) on prospect website + Google Business Profile to draft the tenant config. On the call: founder opens with "I already built your agent — here's how it sounds with your business" using the extracted draft (~10 min demo) → if owner closes, walks through approvals on the same call: services / hours / coverage hours / urgency rules / escalation contact (~15 min) → provisions a Retell DID → carrier call-forwarding setup is done same-day async via screen-share within 24 hours (not "live before hangup" — carrier flows are too variable).
  - **Outcome:** Tenant config approved and DID provisioned by end of the consolidated call; carrier forwarding completes within 24 hours. Total founder time per close: ~30–40 min.
  - **Covered by:** R4, R5, R7, R23

- F4. **Weekly ROI report**
  - **Trigger:** Render Cron Job fires every Monday 7am local-tenant time.
  - **Actors:** A5, A2
  - **Steps:** Pipeline aggregates the prior week's calls per tenant → renders a per-tenant report (calls covered, qualified leads, urgent escalations, owner-marked job conversions, estimated value) → email delivery via the transactional provider.
  - **Outcome:** Owner sees value delivered in their inbox before Monday 9am — the retention artifact.
  - **Covered by:** R20, R21, R26

---

## Requirements

**Platform & runtime**

- R1. Voice runtime is Retell AI. Every inbound, outbound, and transferred call routes through Retell's voice infrastructure. RequestHandoff does not operate a self-hosted voice runtime in the MVP.
- R2. Phone numbers (DIDs) are provisioned through Retell, not directly through Twilio. There is no Twilio voice integration in the MVP.
- R3. The architecture splits across three platforms: **Vercel** hosts the Next.js dashboard (public-facing, latency-tolerant, scale-to-zero); **Render** (Virginia, US East) hosts both the always-on voice hot-path service and the post-call background worker (latency-critical, co-located with Supabase in AWS `us-east-1` for sub-10ms intra-region database access); **Supabase** provides Postgres + Auth + RLS. All three deployables share a typed schema package but ship independently.

**Tenant data & onboarding**

- R4. Each home-service business is a single tenant. Tenants are isolated at the row level in a shared Postgres database; tenant scoping is enforced on every request that touches tenant-owned data.
- R5. The MVP supports two verticals — HVAC and plumbing. Each vertical has a system-owned playbook scaffold (qualification questions, urgency rules, recommended-action heuristics) plus per-tenant overrides for facts the owner approves (services offered, services not offered, hours, coverage hours, escalation contact, geographic service area, pricing-discussion policy, scheduling policy).
- R6. The full assembled prompt and tool-definition set sent to Retell at call setup is composed by RequestHandoff at runtime from the vertical scaffold + per-tenant overrides. RequestHandoff owns the playbook layer; Retell hosts only the resulting per-call configuration.
- R7. Onboarding for the first 50 logos is white-glove using the **demo-IS-kickoff model** (updated 2026-05-04): the founder pre-extracts the tenant profile from public sources (website + Google Business Profile) before the demo, opens the demo with the agent already built against that draft, and walks the owner through approvals on the same consolidated call after the close. Carrier call-forwarding setup completes same-day async (not in-call). There is no separate kickoff call and no self-serve onboarding flow in the MVP.

**Call handling**

- R8. The voice hot-path service exposes four function-call endpoints invoked by Retell during a live call: `check_hours`, `check_service_area`, `request_schedule_window`, `escalate_now`. Each endpoint must respond at p99 < 150ms; none may invoke an LLM on the hot path.
- R9. Per-tenant configuration is cached in-process in the hot-path service with a short TTL so that a typical function call never round-trips to Postgres.
- R10. Urgency classification is rule-driven, not free-form LLM judgment. Each vertical scaffold defines an explicit ruleset (e.g., plumbing: "active leak with main shutoff not used", "burst pipe", "sewage backup"; HVAC: "no heat in freeze conditions", "no cooling with vulnerable occupants"). Per-tenant overrides may add or disable rules but cannot weaken the core scaffold.
- R11. When an urgency rule fires mid-call, the agent invokes `escalate_now`. The hot-path service returns the active escalation policy (owner phone number + warm-transfer prompt + retry policy). Retell places an outbound call to the owner and warm-transfers the caller on owner pickup.
- R12. Every call produces a transcript stored against the tenant. Transcripts are retained for 90 days by default; the retention period is per-tenant configurable in v1.1 (deferred from MVP).
- R13. Escalation attempts are logged with timestamp, target number, ring duration, outcome (answered / no-answer / declined), and the resulting lead status. No escalation may silently fail — every attempt produces an audit record.
- R14. The system never invents an emergency policy. If an urgency rule is not pre-defined for a vertical or tenant, the call is treated as non-urgent regardless of caller language.

**Lead delivery & dashboard**

- R15. Post-call lead extraction runs on Vertex AI Gemini 3 Flash (model ID `gemini-3-flash-preview`, version pinned — not aliased), using a structured-output schema (`responseSchema` + `responseMimeType: application/json`) that produces: caller name, callback number, email if offered, service category, issue description, location, urgency level, preferred appointment window, recommended next action, missing-information flags, and call confidence score. The system prompt + schema + few-shot examples use Vertex AI context caching for ~90% discount on the repeated prefix. No Pro-tier fallback at MVP — Flash is strong enough on the judgment fields, and the hybrid math doesn't pay back at our scale.
- R16. Lead delivery runs as in-process fan-out inside the post-call worker: each captured lead is dispatched in sequence to every per-tenant-configured handler (email, Jobber, HCP, Zapier) with try/catch isolation, so a delivery failure on one channel does not block the others. A dedicated job runner (Trigger.dev / BullMQ) is deferred to v1.1 if/when integration count or volume demands it.
- R17. Email lead delivery via a transactional email provider is the always-on baseline at MVP launch. It cannot be disabled by the tenant.
- R18. Direct integrations to Jobber and Housecall Pro ship after the first paying logo, not before. Target: Jobber by week 5, HCP by week 8 of the build. ServiceTitan is explicitly excluded from MVP.
- R19. A private Zapier app provides the long-tail catch-all for any destination not covered by direct integrations. Builds in weeks 9–12.
- R20. The dashboard surfaces, per tenant: recent calls (last 30 days), captured leads with status (new / contacted / booked / lost / spam), call transcripts, the per-tenant escalation log, plan usage (calls used vs included), and the weekly ROI report archive.
- R21. The owner can mark each lead's outcome — including a self-attributed dollar value when the lead became a job. This data feeds the North Star metric (qualified leads/biz/week) and the weekly ROI report.

**Data, security, compliance**

- R22. Data isolation is enforced via Supabase row-level security policies tied to a per-request tenant identifier. Supabase ships RLS as the default access pattern with a policy editor in the dashboard, so tenant scoping is enforced at the API layer rather than hand-rolled in application code. There is no schema-per-tenant or database-per-tenant pattern.
- R23. Texas is the launch jurisdiction (one-party-consent for call recording). The agent's opening greeting includes a brief recording disclosure regardless — for trust and brand consistency, not legal necessity. Out-of-Texas dialing is out of scope for MVP.
- R24. Secrets (Retell API keys, Vertex AI service-account JSON, third-party integration tokens) live exclusively in each platform's native secret store — Vercel Environment Variables, Render Environment Groups, Supabase Vault — scoped to the deployable that needs them. No secret values appear in code, source-controlled environment files, or logs.
- R25. PII fields (caller name, phone, email, address) are encrypted at rest at the database layer and never written to application logs. Transcripts may contain PII and are subject to the same controls.

**Operations**

- R26. Render Cron Jobs drive the weekly ROI cron. The post-call worker runs in-process retry-with-backoff (exponential, capped at 5 attempts) for lead-delivery failures and escalation retries when an outbound call rings out. A dedicated job runner is deferred to v1.1 if/when retry volume justifies it.
- R27. Observability spans platform-native logs (Vercel + Render + Supabase) plus Sentry for error tracking and aggregated alerting. The hot-path service emits a structured log line per function call with tenant ID, latency, outcome; a Sentry (or Render) alert fires when p95 latency exceeds 200ms for 5 consecutive minutes.
- R28. Per-tenant call usage is metered against the plan tier (Starter 75 / Growth 250 / Pro 600). Overages are tracked but not auto-billed in MVP — the founder reviews overage reports manually for the first 50 logos. Stripe automated overage billing is a v1.1 task.
- R29. The architecture must allow a future swap of Retell for an alternative voice runtime (Vapi, LiveKit Agents, or Gemini 3.1 Flash Live once it reaches GA with async function calling and managed-runtime support) without rewriting the playbook layer, the urgency engine, or the lead-extraction pipeline. This is achieved by (a) keeping all product logic outside Retell prompts and (b) wrapping the call-bootstrap and webhook-receiver code paths behind a small `VoiceRuntime` interface — three methods: `startCall`, `onTranscript`, `executeTool` — so a future swap is a week of work, not a quarter.

---

## Acceptance Examples

- AE1. **Covers R1, R8, R15.** Given a tenant configured for HVAC in Austin with hours Mon–Sat 8am–6pm, when a homeowner calls at 7:45pm on a Tuesday saying "my AC stopped working, my baby is upstairs," then Retell answers with the tenant's recorded greeting, calls `check_hours` (returns: closed, after-hours coverage active), runs the HVAC playbook including "vulnerable-occupant" probe, classifies urgency as urgent (no cooling + vulnerable occupant rule), invokes `escalate_now`, and after warm transfer the post-call pipeline produces a structured lead within 60 seconds of hangup with `urgency: urgent`, `escalation_outcome: bridged`, `recommended_action: dispatched`.

- AE2. **Covers R10, R11, R13.** Given a plumbing tenant with the default urgency scaffold and the owner's mobile number on file, when a caller reports an active leak with the main shutoff not used, then `escalate_now` fires, an outbound call to the owner is placed, the owner picks up on the third ring, the agent gives a one-sentence brief, the caller is bridged in, and the escalation log records: timestamp, owner number, ring duration ~9 seconds, outcome `answered`, lead status `urgent_escalated`.

- AE3. **Covers R10, R14.** Given a plumbing tenant whose vertical scaffold lists "burst pipe" as an urgency rule but does not list "high water bill", when a caller says "my water bill is way higher than usual, I think there's a leak somewhere", then the agent does *not* invoke `escalate_now` (no rule matches), captures the lead with `urgency: standard`, and returns a non-urgent recommended action.

- AE4. **Covers R16, R17.** Given a tenant configured with email + Jobber integration, when the post-call worker dispatches the captured lead and the Jobber API returns 503, then the email handler still delivers the lead summary on first attempt and the Jobber handler retries in-process with exponential backoff (capped at 5 attempts); the email delivery is not blocked or delayed by the Jobber failure.

- AE5. **Covers R8, R9, R27.** Given the hot-path service with a warm Postgres pool and per-tenant config cached, when Retell invokes `check_service_area` mid-call with a tenant ID and a ZIP code, then the response returns within 150ms p99 across 1000 sequential calls, no LLM call is made on the path, and the structured log line captures tenant ID + latency + decision.

---

## Success Criteria

- A first paying tenant (real Austin HVAC or plumbing owner-operator) is live, forwarding their main line during after-hours, and has captured at least one qualified lead within 12 weeks of build start.
- The hot-path service hits p99 < 150ms on `check_hours`, `check_service_area`, `request_schedule_window` under realistic per-tenant load.
- A solo on-call (the founder) can debug a failed call from end to end by correlating Render logs + Supabase logs + Sentry events — three log streams, one platform-native dashboard each, with the call ID propagated through every hop.
- `/ce-plan` can read this document and produce a buildable, sequenced implementation plan without inventing product behavior or escalation policy.
- A future swap of Retell for an alternative runtime would touch only the call-bootstrap and webhook-receiver code paths — not the playbook layer, urgency engine, or lead-extraction pipeline.

---

## Scope Boundaries

- **No SMS in MVP.** Caller confirmations, owner alerts, and report links are email-only or live-call. Add SMS in v1.1 once the email-vs-call escalation matrix is validated in production.
- **No ServiceTitan integration.** Certification window (6–12 weeks) burns the build runway. Defer to v1.1 once ICP concentration justifies it.
- **No calendar booking, automated quoting, or payment collection.** The agent captures preferred windows; the owner books the appointment.
- **No Spanish or other non-English language support** in the launch market.
- **No multi-line per tenant, no multi-location / franchise complexity.**
- **No staffed 24/7 human fallback.** Available only as a priced premium add-on after MVP.
- **No replacement of the customer's existing CRM, dispatch, or scheduling tool.** RequestHandoff hands off; it does not take over. (Per STRATEGY.md and the integration-neutral handoff track.)
- **No self-serve onboarding flow.** White-glove only at MVP; self-serve is a v1.1 task.
- **No native mobile app.** Mobile-friendly web dashboard is sufficient for the owner-operator persona.
- **No additional verticals.** Roofing, electrical, garage door, pest control, pool, and landscaping are deferred to v1.1.
- **No automated overage billing in Stripe.** Manual review and ad-hoc invoicing for the first 50 logos.
- **No Twilio voice integration.** All telephony flows through Retell-provisioned DIDs.
- **No Gemini Live API as the live voice runtime.** Re-evaluation triggers are listed in Outstanding Questions → Deferred to Planning; calendar reminder set for ~July 1, 2026 to re-check.
- **No upsell or cross-sell logic during calls.**

---

## Key Decisions

- **Voice runtime: Retell AI.** Purpose-built for inbound business agents, native Twilio + Custom Functions, best-in-class call-shaped observability, ~$0.07–$0.13/min realized cost keeps Starter-tier gross margin above 70%. The single managed product that collapses 6–8 weeks of plumbing into a config file, which is decisive at solo + 8–12 week budget.
- **Stack: Vercel + Supabase + Render (V/S/R).** Three pay-as-you-go vendors with generous free tiers replace the GCP-everything plan, which would have required full-rate always-on services with no trial credits available. Vercel hosts the Next.js dashboard. Supabase provides Postgres + Auth + RLS in `us-east-1` (Virginia) — built-in RLS enforcement removes hand-rolled tenant scoping. Render hosts the hot-path service and the post-call worker in its Virginia region (same AWS `us-east-1` footprint as Supabase, sub-10ms intra-region RTT — the database-locality advantage that drives the <150ms p99 budget on mid-call function calls). **Render chosen over Fly.io and Railway:** Fly's `dfw` region adds ~30ms cross-country to Supabase Virginia (vs Render's ~5ms intra-AZ), and Fly's 2025 IAD-dependency outage pattern is the wrong reliability profile for a real-time voice product. Railway has the same locality advantage but had three major incidents in late 2025 (including a security exploit pausing all builds) — disqualifying for solo MVP. Total infra cost: ~$0–25/mo build phase; ~$50–100/mo at 50 paying logos (excluding Retell).
- **Telephony: Retell-only, no Twilio in MVP.** Single telecom vendor. Drops the second integration, single bill, and removes the BYO-SIP setup time. The trade-off is no SMS at MVP — accepted; urgent escalation goes through Retell outbound call + warm transfer instead.
- **Post-call LLM: Gemini 3 Flash via Vertex AI** (`gemini-3-flash-preview`, version pinned). Latest model in the Gemini 3 family with structured output and function calling combined in a single call (Gemini 2.5 Flash forced you to choose); 3 Pro-class reasoning at Flash latency benefits the judgment fields (urgency level, recommended action, confidence score) that drive escalation behavior — a 7-point reasoning-benchmark gap vs Gemini 3.1 Flash-Lite that maps directly to the field where a wrong answer is a churn event. Per-summary cost ~$0.00110 (~31% input bump vs Gemini 2.5 Flash; rounding error against the $0.15 per-call COGS target). Context caching on the static prompt prefix delivers ~90% discount on repeated content. **No Pro-tier fallback at MVP** — adding one costs more total than Flash-solo at our scale, and Flash's judgment-field reliability makes the fallback dead weight. Live-call LLM stays inside Retell (whatever Retell defaults to).
- **Architecture shape: hybrid orchestration (Approach B).** Retell handles the live conversation; the playbook layer and the lead pipeline live in code we own. This is the only shape that lets STRATEGY.md's two structural differentiators (vertical-specific intake + integration-neutral handoff) live in our codebase rather than in someone else's product.
- **Voice hot path on Render Web Service** (Starter $7/mo, Virginia region, always-warm by default — no `min-instances` configuration to manage). Co-located with Supabase in AWS `us-east-1` for sub-10ms intra-region DB round-trips, which is what makes the <150ms p99 latency budget hit comfortably with headroom for Retell→endpoint network jitter. Serverless cold starts on the function-call hot path would produce audible silence to the caller; Render's Starter tier avoids that without the operational tax of `min-instances=1` configurations on Cloud Run.
- **Tenant isolation: Supabase row-level security.** Supabase ships RLS as the default access pattern (policies edited in the dashboard, enforced by the API layer) — removes the hand-rolled `SET LOCAL app.tenant_id` boilerplate that would have been needed on Cloud SQL. Schema-per-tenant or database-per-tenant rejected as overengineered for MVP scale.
- **Integration delivery: in-process fan-out from the post-call worker.** Each integration handler runs in sequence with try/catch isolation — a Jobber outage doesn't block email delivery, and adding the Zapier app in week 9–12 is a new handler in the dispatch loop rather than a queue-topology change. Pub/Sub-style event fan-out is deferred to v1.1 once integration count or per-tenant complexity demands it; at <200 logos, sequential delivery in a single worker is simpler and works.
- **Vertical scope: HVAC + plumbing only at MVP.** Triple seasonality in Austin makes both verticals tractable; deferring roofing/electrical/etc. lets the playbook scaffolds get genuinely good before breadth is added.
- **Onboarding: white-glove for first 50 logos.** Solo founder time spent on shared kickoff calls is also customer research; self-serve onboarding does not de-risk anything in the first 12 weeks.

---

## Dependencies / Assumptions

- A Retell account with production access and quota for ~50 tenants is provisioned by build week 1.
- Vercel, Supabase, and Render accounts are provisioned by build week 1. Supabase project lives in `us-east-1` (Virginia). Render project lives in `Virginia (US East)` region. A Sentry account is provisioned for error tracking. The founder owns billing on each.
- A transactional email provider (Resend or Postmark — exact choice deferred to `/ce-plan`) is provisioned with DKIM/SPF set on the production domain by build week 2.
- Austin carrier porting / call-forwarding flows work as documented for the carriers our first cohort actually uses (AT&T, Verizon, T-Mobile, Spectrum business voice). Failure mode: a small percentage of carriers may require manual conditional-forwarding setup; the white-glove onboarding accommodates this.
- Retell's outbound-call + warm-transfer feature is reliable enough to serve as the *only* urgent-escalation channel without an SMS fallback. Validation is required during build week 4 — if reliability is below 95%, SMS gets pulled forward into MVP scope.
- Vertex AI's Gemini 3 Flash structured-output schema feature returns JSON valid against our schema in >99% of post-call extractions across the first 200 production calls. Failure mode: a small number of summaries require a re-prompt or manual cleanup.
- Gemini 3 Flash is in **public preview** on Vertex AI as of May 2026, not formal GA. Google treats it as production-ready (it is the default in Gemini Enterprise / Vertex AI / Gemini CLI), but the SLA is weaker than GA. Action: pin the version string `gemini-3-flash-preview` rather than an alias; budget a ~2-hour migration window when formal GA lands (expected within the quarter).

---

## Outstanding Questions

### Resolve Before Planning

(None. The synthesis was confirmed; all scope-shaping questions have been resolved or routed to "Deferred to Planning" below.)

### Deferred to Planning

- [Affects R2, R23] [User decision] Exact wording of the agent's opening greeting + recording disclosure for Texas one-party-consent. Sample: "Hi, this is [Business] — for quality, this call may be recorded. How can I help?" Final wording resolved during planning.
- [Affects R6] [Technical] Agent voice/persona spec. Choice between "calm dispatcher", "friendly receptionist", or "neighbor-who-knows-the-business" tonality. Resolved during planning by listening to sample calls from each Retell voice option against the HVAC and plumbing scripts.
- [Affects R20] [Technical] Authentication for the dashboard — Supabase Auth (built-in, default) vs. Auth.js with Supabase as the database. Supabase Auth is the default; resolved during planning only if its constraints (email/OAuth flows, custom claims) materially limit the dashboard UX.
- [Affects R17] [Technical] Email provider — Resend vs. Postmark. Both are credible; resolved during planning based on deliverability test results from a Austin IP block.
- [Affects R15] [Technical] Exact lead-extraction prompt and structured-output schema for Gemini 3 Flash. Iterated during planning against a corpus of synthetic + early production transcripts.
- [Affects R28] [User decision] Failure-mode contract / SLA — what RequestHandoff promises when the agent mishandles a call (refund, free month, mid-call auto-escalation). Trust artifact buyers will ask about; resolved during planning, then surfaced in `GTM-PLAYBOOK.md` v1.1.
- [Affects R5] [Needs research] Austin HVAC and plumbing owner-interview pass — 10 cold-call discoveries during build weeks 1–2 to replace assumed urgency rules and switch-trigger language with verbatim owner quotes. Resolved during planning by scheduling the interviews into the week-1 plan.
- [Affects R1, R2, R29] [Trigger-watch] Re-evaluate the live voice runtime when **any one** of the following flips: (a) Retell's changelog adds `gemini-3.1-flash-live` to the model dropdown ([retellai.com/changelog](https://www.retellai.com/changelog)); (b) Google ships async function calling on Gemini 3.1 Flash Live ([Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog)); (c) LiveKit closes [agents-js #1179](https://github.com/livekit/agents-js/issues/1179) and [agents #5234](https://github.com/livekit/agents/issues/5234) so `update_chat_ctx` works on 3.1 Live; (d) a shipped commercial competitor (not a demo) publishes a 3.1-Flash-Live receptionist deployment with measured tool-call latency. Calendar reminder: re-check ~July 1, 2026.
