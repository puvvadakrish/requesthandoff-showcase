---
name: RequestHandoff
last_updated: 2026-05-02
parent: STRATEGY.md
---

# RequestHandoff GTM Playbook

Tactical companion to `STRATEGY.md`. STRATEGY.md is the durable anchor (problem, approach, persona, metrics, tracks). This file is the *executable* layer — pricing, beachhead, channel mechanics, competitor positioning, sales scripts. Expect this file to change every quarter.

---

## 1. Beachhead market: Austin metro

**Why Austin** (vs. Phoenix, Tampa, Atlanta, Houston, Charlotte, Nashville, Orlando):

- **Triple seasonality** — extreme summer heat (HVAC), the 2021/2024 freeze trauma still fresh in plumbers' minds (burst-pipe PTSD = high willingness to pay), and spring hailstorms that flood roofers with calls. Three distinct "I missed a $4k job" moments per year vs. Phoenix's one.
- **SMB density** — ~18–22k small specialty trade contractors (NAICS 238) across Travis, Williamson, Hays, and Bastrop counties. Strong owner-operator culture and phone-first buying.
- **Reachability** — Texas business filings are public and scrapeable; BBB-Austin, TACCA (HVAC), and PHCC of Central Texas (plumbing) publish member directories.
- **Less saturated than Phoenix** — Goodcall and Numa case studies lean Phoenix/SoCal HVAC. Austin gets dialed but isn't the poster-child metro, so cold outbound still earns attention.
- **Healthy job size** — median home value $340–400k in target suburbs (Plano, Frisco, Southlake, Arlington) keeps job sizes high without LA-tier price sensitivity.

**Runner-up:** Tampa-St. Pete if hurricane-driven urgency + lower competition outweighs the smaller SMB pool (~40% smaller than Austin).

**Validation step before committing:** Pull Google Trends for "emergency plumber Austin" (Feb 2021 / Jan 2024 spikes) and "roof repair Austin" (April–May hail season). If search volume spikes 5x+ baseline, lean hard into seasonal-urgency cold outreach.

---

## 2. Pricing anchors

**Per-call variable cost (3-min call, ~3000 in / 500 out tokens, 1.5 SMS avg):** ~$0.10 low / **$0.15 mid** / $0.27 high. Sources: Twilio Voice + SMS, Deepgram Nova-3 STT, Claude Haiku 4.5 LLM, ElevenLabs Turbo TTS.

**Tiers:**

| Tier | Monthly | Annual | Included | COGS @ included | GM |
|---|---|---|---|---|---|
| **Starter** | $79 | $65 | 75 answered calls, 1 number, email lead summaries, business-hours email escalation (SMS in v1.1) | ~$11 | **86%** |
| **Growth** | $179 | $149 | 250 answered calls, 24/7, urgent live-call escalation via Retell warm transfer, CRM webhook, custom qualification flow | ~$38 | **79%** |
| **Pro** | $349 | $289 | 600 answered calls, integrations (Jobber, Housecall Pro, Zapier), priority support (multi-line, Spanish, custom voice, calendar booking, ServiceTitan in v1.1) | ~$90 | **74%** |
| Overage | $0.49/call | — | — | $0.15 | 69% |

**Anchoring logic:**

- **Starter $79** matches Goodcall's psychological floor and stays under the $100 "no-CFO-approval" line; undercuts every live-receptionist floor by 3-4x.
- **Growth $179** sits in a clean white-space gap between AI-native ($79–$129) and live-receptionist ($235–$325). Positions RequestHandoff as the upgrade path for owners who tried Rosie/Goodcall and outgrew them.
- **Pro $349** is still cheaper than Ruby's 50-min plan ($245) on a per-call basis (~$0.58 vs. Ruby's $4.90/min) while matching the integrations bar that ServiceTitan-using contractors expect.
- **$0.49 overage** carries 69% margin — protects you on outliers without nickel-and-diming. Pair this with a hard "no escalation fees, ever" promise to attack Smith.ai's $4.25 escalation surcharge head-on.

---

## 3. Competitor battlecard

| Competitor | Starting price | Position | Vertical | Top weakness | RequestHandoff counter |
|---|---|---|---|---|---|
| **Avoca** | (custom, KP-backed, $1B val) | Vertical home-services AI for HVAC/plumbing/roofing/electrical, dispatch-heavy | Home services | Wants to *be* the dispatch system; opaque pricing | We hand off *into* your existing dispatch (Jobber/Housecall Pro/ServiceTitan), don't replace it. Flat published price. |
| **ServiceTitan AI Voice** | Bundled in ServiceTitan | Voice agent inside the contractor OS | Home services (ST customers only) | Locked to ServiceTitan; ST is heavy/expensive | We work for the ~80% of small home-service businesses *not* on ServiceTitan. |
| **Goodcall** | $79/mo (100 callers) | DIY-configurable AI receptionist | General SMB | Robotic voice, support complaints, overage escalation | Done-for-you setup, not DIY. Vertical playbooks pre-built. |
| **Rosie** | $49/mo (250 min) | AI answering, calendar-aware | General SMB | Features locked behind upper tiers; chat-only support | Single tier with all integrations included; live human support at Pro. |
| **Numa** | ~$49/mo entry | Flat-rate AI texting + answering | Restaurants, dental | Weak for high-call-volume; not home-services native | Vertical fit; integration with field-service stack. |
| **Smith.ai** | $95/mo AI / $300+ live | Hybrid AI + human | Law, professional | $4.25 per escalation surcharge — the loudest complaint in the category | "No per-call escalation fees, ever." Make this the headline. |
| **Ruby Receptionists** | $245/mo (50 min) | Premium human-staffed | Professional | Severe billing-complaint history; per-minute model | 5x lower entry, AI-native, no minute-counting. |
| **AnswerConnect** | $325/mo (100 min) | Live answering + CRM | General | Opaque per-minute; $250–300 port-out fees | Flat published pricing; no port-out friction. |
| **Newo / RealVoice** | (varies) | Home-services AI receptionist | Home services | Smaller, less differentiated; mostly ServiceTitan-integrated | Integration-neutral handoff is our wedge against them too. |
| **Dialpad AI** | $15+/user/mo | Unified omnichannel | Enterprise | Hidden add-on fees; enterprise minimums | We're SMB-focused. They sell up; we sell down. |

**Source URLs for pricing claims:** [Goodcall](https://welco.ai/blog/goodcall-ai-receptionist-pricing/) · [Rosie](https://heyrosie.com/pricing) · [Smith.ai](https://smith.ai/pricing/ai-receptionist) · [Ruby](https://www.ruby.com/plans-and-pricing/) · [AnswerConnect](https://www.answerconnect.com/blog/answerconnect-services/call-answering-service-cost/) · [Posh](https://posh.com/pricing/) · [PATLive](https://www.patlive.com/pricing) · [Dialpad](https://www.dialpad.com/pricing/) · [Avoca coverage](https://fortune.com/2026/04/27/avoca-ai-agents-missed-calls-hvac-plumbing-roofing-kleiner-perkins-chen-shrivastava-braswell/) · [ServiceTitan Pro](https://www.servicetitan.com/features/pro/contact-center/voice-agents)

---

## 4. The acquisition motion: missed-call audit → demo-from-website → trial → paid

**The opening offer (free):** "We'll run a 7-day missed-call audit on your business — we ping your line outside hours and after-no-answer windows, and show you exactly how many high-intent callers you're losing every week. Free, no commitment."

**The demo (mid-funnel):** Done-for-you — extract the prospect's website + GBP, pre-build their RequestHandoff agent in 20 minutes, and call them back from the agent's number. They hear *their own business* answer the phone correctly. This is the moment that converts.

**The trial (closing):** 14 or 30 days. Required: forward calls during after-hours and no-answer windows. Weekly report shows captured leads + estimated dollar value (caller intent × industry job-size benchmark).

**Industry stats for cold outreach:**

- 27–28% of inbound calls go unanswered for home services in normal periods, 40%+ during peak season ([Invoca](https://www.invoca.com/blog/how-much-missed-sales-calls-cost-home-services-businesses/))
- 85% of missed callers don't leave a voicemail — they call the next provider on Google
- Average missed-call cost: **$1,200**
- HVAC: **$45–120k/year** lost. Plumbing: $50–60k/year. Roofing: 20% of peak-season calls missed industry-wide.

**Sales-script openers (use the owner's likely situation, not marketing language):**

1. *"You're on a roof, the phone rings — who answers? If the answer is 'voicemail,' you're losing $1,200 every time it happens. We'll show you exactly how often it's happening at your shop, free."*
2. *"Quick one — when [company] gets a call at 7pm on a Saturday, what happens? I ask because the average HVAC shop in Austin is missing 30% of calls and 85% of those callers go to a competitor before Monday."*
3. *"You picked Jobber [or Housecall Pro / ServiceTitan]. We don't replace it — we make sure every call after-hours ends up *in* it as a clean lead. Mind if I show you in 10 minutes?"*

**Validation gap:** We don't yet have verbatim owner quotes. **Action: run 10 cold-call discovery interviews with Austin HVAC owners in the first 2 weeks** to capture real language for v2 of these scripts. The Jobber-community user who said *"The AI receptionist makes sure no call goes to voicemail. That alone is worth its weight in gold"* is the closest we have today.

---

## 5. First-100-logo plan (Austin metro)

**Week 1:**
- Pull BBB-Austin + Texas SOS list of HVAC, plumbing, roofing LLCs registered 2019–2024 in Travis + Williamson counties.
- Filter to <10 employees (LinkedIn / Apollo enrichment).
- Stand up the missed-call audit tooling on a Twilio number.
- Run audit on 200 businesses; rank by miss rate.

**Weeks 2–4:**
- Cold outreach to top 50 audited businesses with their *own* miss-rate data + dollar estimate of lost revenue.
- Goal: 10 trials live by end of week 4. Convert 3–5 to paid Starter/Growth.

**Weeks 5–12:**
- Expand outreach to 500 audited businesses.
- Recruit first 3 paying logos as referral champions; offer 1 month free per referred logo.
- Stand up vertical landing pages (`/hvac`, `/plumbing`, `/roofing`) with Austin-specific case studies once we have them.

**Months 4–6:**
- Partnership outreach: TACCA Centex (Austin chapter), PHCC of Central Texas, local SEO agencies serving home services.
- Goal at month 6: **40 paying logos in Austin** at a blended ARPU of ~$165 = $6.6k MRR.
- Goal at month 12: **100 paying logos** in Austin + 1 expansion metro (San Antonio or Houston).

---

## 6. Open questions parked for the next iteration

- **Compliance stance:** Two-party-consent recording states (TX is one-party), TCPA for SMS confirmations, and PHI handling for the family-care segment if/when we expand there. Pick before launch.
- **Failure-mode contract:** What we promise when the agent mishandles a call. Refund? Free month? Auto-escalation mid-call? Trust artifact buyers will ask about on call #1.
- **Agent voice/persona spec:** "Friendly dispatcher" vs. "professional receptionist" vs. "neighbor who knows the business" — affects retention and brand.
- **Real owner-interview pass:** 10 Austin cold-call discoveries in weeks 1–2 to replace assumed switch-trigger language with real verbatim language.
