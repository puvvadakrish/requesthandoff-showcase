# RequestHandoff Product Strategy & Requirements

> **Document status (added 2026-05-03):** This PRD is the original product strategy artifact (~1,250 lines) authored before the product was renamed and before the technical design phase. It is preserved here for spec depth (FR1–FR10, segment long-form, risk register). The current canonical anchor for problem framing, approach, persona, metrics, and tracks is **`STRATEGY.md`** at the repo root; when this PRD and STRATEGY.md disagree, STRATEGY.md wins. The locked technical design lives in **`docs/brainstorms/requesthandoff-design-requirements.md`** and supersedes §12 of this PRD. The working name "Call Coverage" used throughout the body below refers to the same product, now named **RequestHandoff**.

## Working Product Concept

This document captures the product story, market focus, customer problems, differentiation strategy, core business expectations, and product requirements for a call coverage and lead intake service for local service businesses.

The original working name was **Call Coverage**; the product is now **RequestHandoff**. The name reflects the intended positioning: this is not only an after-hours answering product. It is a broader call coverage layer for moments when a business cannot answer the phone — after hours, weekends, lunch breaks, job-site hours, overflow periods, staff shortages, storm surges, seasonal spikes, or any time a high-intent customer call might otherwise be missed.

The customer-facing pitch should not lead with AI. AI may be the backend engine, but the business buyer cares about outcomes: calls answered, leads captured, urgent calls escalated, appointments scheduled, and Monday-ready summaries delivered.

---

# 1. Product Story

Local service businesses lose real revenue when they miss phone calls. Their customers often call when they are ready to act: a homeowner has a leaking pipe, an AC unit stops working, a roof needs inspection after a storm, a pool pump fails, a pet owner needs grooming availability, or a salon customer wants to book an appointment. These are high-intent moments. If nobody answers, the customer often moves on to the next provider.

For larger companies, this problem is solved with a staffed front desk, call center, dispatch team, CRM workflows, and scheduling software. For small local businesses, the reality is different. The owner may be on a job site. The office manager may be gone for the day. The technician may be driving. The business may be closed on weekends even though customers are researching and calling during weekends. Voicemail is not enough. Many callers will not leave a message, and even when they do, the business may not follow up quickly enough.

The opportunity is to provide small businesses with a simple service that makes their phone line feel professionally covered without requiring them to hire weekend staff, train a receptionist, or adopt a complex SaaS platform.

**RequestHandoff** is a service that answers inbound customer calls when the business cannot, captures the customer's intent, asks the right qualification questions, handles basic service information, schedules or requests preferred appointment times, escalates urgent calls when needed, and sends the business a clean, structured summary.

The product starts with a simple wedge:

> “We cover your calls when your team cannot answer.”

The initial go-to-market wedge can be nights and weekends, because the pain is obvious and easy to explain. However, the broader product should support business-hours overflow as well. That means the product should not be branded only as “after-hours.” After-hours is an entry point, not the full category.

The larger story is:

> Local businesses should not lose high-intent customers just because nobody was available to pick up the phone.

The product becomes a lightweight front-office layer for businesses that do not have the time, budget, or operational maturity to run a sophisticated intake process themselves.

---

# 2. Market Segments and Target Customers

The target market should not be “all small businesses” at launch. That is too broad. The product should begin with a focused set of local service businesses where missed calls have high value, customer intent is strong, and the call flow can be standardized.

## 2.1 Primary Segment: Home and Property Services

This should be the first beachhead.

### Target business types

- HVAC companies
- Plumbing companies
- Roofing companies
- Electrical contractors
- Garage door repair companies
- Pest control companies
- Pool service companies
- Landscaping and lawn care companies
- Handyman services
- Home cleaning and maid services
- Window cleaning services
- Fence repair companies
- Foundation repair companies
- Appliance repair companies
- Water heater repair/replacement companies

### Why this segment is attractive

Home and property services are high-value, high-intent, phone-driven businesses. Customers often call because something needs to be fixed, inspected, quoted, or scheduled. Many calls happen outside standard office hours because homeowners research service providers after work or on weekends. Emergency and urgency rules are also common, which makes escalation valuable.

### Typical workers/users involved

- Owner/operator
- Office manager
- Dispatcher
- Field technicians
- Sales estimator
- Service manager
- Weekend/on-call technician

### Typical caller needs

- “Do you service my area?”
- “Can someone come tomorrow?”
- “Is this an emergency?”
- “Do you repair or replace this?”
- “Can I get an estimate?”
- “What are your hours?”
- “How much does this usually cost?”
- “Can I schedule an inspection?”
- “Can someone call me back Monday?”

This segment has strong ROI because one captured job can justify the monthly cost.

## 2.2 Secondary Segment: Appointment-Based Local Services

This segment is also attractive, but the workflow is more scheduling-heavy than urgency-heavy.

### Target business types

- Hair salons
- Barbershops
- Nail salons
- Med spas
- Massage therapy clinics
- Wellness studios
- Personal trainers
- Yoga and Pilates studios
- Pet groomers
- Auto repair shops
- Car detailing shops

### Why this segment is attractive

These businesses rely on appointments, repeat customers, cancellations, rescheduling, and service menus. The value proposition is not just “answer the phone.” It is “book the appointment, reduce back-and-forth, and keep the calendar full.”

### Typical workers/users involved

- Owner/operator
- Front desk staff
- Individual service providers
- Stylists, groomers, technicians, trainers
- Scheduling coordinator

### Typical caller needs

- “Do you have availability this weekend?”
- “How much does this service cost?”
- “Can I book with a specific provider?”
- “Can I reschedule?”
- “Do you take walk-ins?”
- “How long does the appointment take?”
- “Do I need to pay a deposit?”
- “Do you have cancellation fees?”

This segment requires stronger calendar integration, service menus, cancellation rules, provider-specific availability, and confirmation messages.

## 2.3 Tertiary Segment: Professional and Trust-Based Services

This segment can be lucrative but carries higher risk because calls may involve more sensitive information and higher expectations.

### Target business types

- Small law firms
- Accounting firms
- Tax preparers
- Insurance agencies
- Financial service offices
- Real estate agents and brokers
- Property managers
- IT support providers

### Why this segment is attractive

These businesses often have high lead value. A single qualified client can be worth hundreds or thousands of dollars. However, trust, intake quality, privacy, and compliance become more important.

### Typical workers/users involved

- Owner/partner
- Office administrator
- Intake coordinator
- Case manager
- Licensed professional
- Sales/relationship manager

### Typical caller needs

- “Can I schedule a consultation?”
- “Do you handle this type of issue?”
- “What documents should I bring?”
- “What is your fee structure?”
- “Can someone call me back?”
- “Is this urgent?”

This segment should likely come after the home-service wedge unless the product has strong human fallback and compliance controls.

## 2.4 Family and Life-Support Services

This segment has recurring revenue potential but may involve trust and safety concerns.

### Target business types

- Pet sitting
- Dog walking
- Pet grooming
- Childcare centers
- Senior care agencies
- Home care services
- Personal concierge services
- Home organizing services

### Why this segment is attractive

These businesses depend heavily on trust and recurring relationships. The call flows are often about availability, pricing, policies, location, and first appointment intake.

### Typical workers/users involved

- Owner/operator
- Care coordinator
- Scheduler
- Service provider
- Office assistant

### Typical caller needs

- “Do you have availability?”
- “What are your rates?”
- “What areas do you serve?”
- “What is your intake process?”
- “Are you licensed/insured?”
- “Can I book a visit?”

This segment should be approached carefully, especially where care, safety, children, seniors, or health-related claims are involved.

---

# 3. Problems We Are Solving

## 3.1 Missed Calls Become Lost Revenue

The core problem is simple: customers call when they are ready to act, and many local businesses are unavailable. Missed calls are not just communication failures. They are lost opportunities.

A customer who calls a plumber, HVAC company, roofer, or salon is often in buying mode. If they get voicemail, they may call the next business on Google. This is especially true for urgent services.

## 3.2 Small Business Owners Are Too Busy to Implement Software

Most local service business owners do not want another SaaS platform to configure. They are busy running jobs, managing crews, scheduling customers, sending invoices, and dealing with operational fires.

The product must therefore be low-touch and done-for-you. It should not require the business owner to write scripts, design workflows, upload training documents, or become an AI prompt engineer.

## 3.3 Existing Solutions May Be Too Generic, Too Expensive, or Too Hard to Trust

The market already has answering services, virtual receptionists, business phone systems, and AI receptionist tools. However, many small businesses still do not use them. Reasons include lack of awareness, lack of trust, unclear ROI, setup friction, fear of poor customer experience, or not knowing which product to choose.

The opportunity is not just product capability. The opportunity is packaging, onboarding, vertical focus, and go-to-market.

## 3.4 Voicemail Is Not a Reliable Safety Net

Voicemail creates friction. Some customers do not leave messages. Others leave incomplete information. Even when they leave a message, follow-up may be delayed. By the time the business calls back, the customer may have already booked with a competitor.

The product replaces passive voicemail with active intake.

## 3.5 Staff Are Interrupted by Low-Value or Repetitive Calls

Even during business hours, small teams can be overwhelmed by repetitive calls:

- Hours of operation
- Service area
- Pricing questions
- Appointment availability
- Basic policy questions
- Spam calls
- Wrong numbers
- Vendor calls

The product should help screen and structure calls so that human workers handle the right calls, not every call.

## 3.6 Urgent Calls Need Escalation, Not Just Notes

For emergency or high-priority requests, simply sending a Monday summary is not enough. The product must identify urgent situations and trigger an escalation path:

- Call the on-call owner/technician
- Send an SMS alert
- Send email notification
- Mark the lead as urgent in dashboard
- Retry escalation if no acknowledgment is received

This is especially important for plumbing, HVAC, electrical, roofing, water damage, garage door, pest control, and similar services.

## 3.7 Businesses Need Structured Follow-Up, Not Raw Transcripts

A transcript is useful, but it is not enough. The business needs a clean summary that can be acted on quickly.

The product should produce structured outputs:

- Caller name
- Phone number
- Email if provided
- Service needed
- Location/service address
- Urgency level
- Preferred appointment window
- Questions asked
- Answers provided
- Recommended next action
- Whether escalation occurred
- Confidence/quality flags

The output should be easy for a small business to act on without reading a long transcript.

---

# 4. Strategy

## 4.1 Customer-Facing Positioning

Do not lead with AI. The customer-facing promise should be practical:

> “We answer when you cannot.”

Possible positioning lines:

- “Every call covered. Every lead captured.”
- “Turn missed calls into booked jobs.”
- “Your backup front desk for busy hours, nights, and weekends.”
- “Capture customers before they call your competitor.”
- “When your team cannot answer, we keep the opportunity alive.”

The backend can use AI, but the buyer should experience the product as a reliable call coverage service.

## 4.2 Initial GTM Wedge

Start with home services in a specific metro area. **Beachhead metro: Austin, TX.**

MVP verticals (locked by `STRATEGY.md` and design doc R5):

- HVAC
- Plumbing

Adjacent home-service verticals — roofing, electrical, garage door repair, pest control, pool service, landscaping/lawn care — are v1.1 expansion candidates once the HVAC and plumbing playbooks are validated in production. The Austin triple-seasonality on HVAC and plumbing makes both verticals tractable for a single founder; deferring breadth lets the playbook scaffolds get genuinely good before more verticals are added.

Why:

- High-intent calls
- Clear qualification questions
- High average job value
- Strong urgency logic
- Easy ROI story
- Many small operators lack professional intake
- Owners understand missed-call pain immediately

The initial pitch should be:

> “We cover your calls after hours and when your team is busy, qualify the customer, escalate urgent requests, and send you a clean lead summary.”

## 4.3 Expansion Strategy

Once the core intake engine works, expand in this order:

1. **Business-hours overflow**
   - Calls route to the service when the business does not answer after X rings.
   - Useful during busy job-site hours.

2. **Calendar scheduling**
   - For businesses ready to let the system book appointments directly.

3. **SMS follow-up** *(deferred to v1.1 — see design doc; MVP urgent escalation goes through Retell outbound call + warm transfer, and caller/owner notifications are email-only)*
   - Send caller confirmation.
   - Send business summary.
   - Send appointment reminders.

4. **CRM/task integration**
   - MVP integrations: Jobber, Housecall Pro, Zapier/Make webhook, email, Google Sheets.
   - v1.1+: HubSpot, Salesforce, Monday.com, ServiceTitan (deferred — certification window burns the build runway; defer until ICP concentration justifies it).

5. **Cross-sell and upsell prompts**
   - Only after trust is established.
   - Example: HVAC tune-up call can suggest duct inspection or water heater check if the business approves.

6. **Human fallback premium tier**
   - For higher-value businesses and risk-sensitive segments.

## 4.4 Pricing Strategy

**Pricing is locked.** See `GTM-PLAYBOOK.md` §2 for derivation. The structure encodes the flat-rate-trust positioning rule (no per-call escalation fees, no per-minute traps, no bill shock — the explicit attack on Smith.ai's $4.25/escalation surcharge and AnswerConnect's opaque per-minute model). Per-call COGS target ~$0.15; gross margins 74–86% across tiers.

### Starter — $79/mo ($65/mo annual)

For very small businesses that want basic coverage.

- 75 calls included
- 1 phone number
- Business-hours SMS escalation *(SMS escalation channel is v1.1; MVP escalation is Retell outbound call + warm transfer — see design doc R11)*
- Business profile setup
- Lead capture
- Email summary
- No direct calendar booking

### Growth — $179/mo ($149/mo annual)

For active service businesses.

- 250 calls included
- 24/7 coverage
- Urgent escalation (Retell outbound + warm transfer at MVP)
- CRM webhook delivery
- Structured lead summaries
- Weekly missed-opportunity report
- Dashboard access

### Pro — $349/mo ($289/mo annual)

For higher-value or higher-volume businesses.

- 600 calls included
- Multi-line support
- Direct integrations (Jobber, Housecall Pro at MVP; ServiceTitan v1.1)
- Priority support
- Multiple escalation contacts
- Advanced reporting
- Custom intake scripts

### Overage and add-ons

- **Overage: $0.49 per call.** No escalation fees, ever. No per-minute charges.
- Human fallback offered as a deliberately priced add-on post-MVP.

## 4.5 Go-To-Market Motion

The GTM should be direct, local, and outcome-driven.

### Recommended GTM tactics

1. **Vertical landing pages**
   - “Call coverage for HVAC companies”
   - “Call coverage for plumbers”
   - “Call coverage for roofers”
   - “Call coverage for pool service companies”

2. **Done-for-you demo (doubles as the kickoff call)**
   - Pre-demo profile extractor pulls services / hours / service area from the business's website + GBP.
   - On the call, show the owner what the caller experience sounds like with their own profile.
   - Show sample lead summary.
   - Approve, provision a Retell DID, and assist with carrier call-forwarding in the same session — the tenant is live by end of call. No separate post-demo kickoff is scheduled.

3. **Missed-call audit offer**
   - “We will help you estimate how many leads you are losing from missed calls.”
   - This creates urgency.

4. **Local business outreach**
   - Call/email businesses with poor phone response or limited hours.
   - Target businesses with high Google review counts but limited front-office sophistication.

5. **Partnerships**
   - Website agencies serving home service businesses
   - Local SEO agencies
   - VoIP providers
   - Chamber of commerce groups
   - Trade associations
   - Local business networking groups

6. **Pilot offer**
   - 14-day or 30-day trial
   - Limited call coverage
   - Weekly summary showing captured opportunities

---

# 5. Differentiation Stack

The market is crowded, so differentiation cannot be “we use AI.” The product must differentiate across the full stack: positioning, onboarding, vertical workflows, caller experience, escalation, reporting, and GTM.

## 5.1 Differentiation Layer 1: Outcome-First Positioning

Most competitors describe themselves as AI receptionists, virtual receptionists, or answering services. This product should position itself around the outcome:

- Calls covered
- Leads captured
- Jobs booked
- Urgent calls escalated
- Clean summaries delivered

The promise is not “AI phone agent.” The promise is “no lost customer opportunities when your team cannot answer.”

## 5.2 Differentiation Layer 2: Done-for-You Onboarding

The product should minimize customer setup. The business owner should not need to train the system manually.

The onboarding system should:

- Pull information from the business website
- Pull public Google Business Profile-like details where available
- Extract service list
- Extract service area
- Extract hours
- Extract FAQ/policy information
- Draft the business profile
- Ask only the missing questions
- Allow quick edits and approval

The goal should be setup in under 30 minutes for the business, with most work automated or done by the provider. **The demo IS the kickoff at MVP** — a single consolidated call backed by a pre-demo profile extractor (website + GBP) means the owner approves and goes live in the same session. There is no separate post-demo kickoff scheduling step.

## 5.3 Differentiation Layer 3: Vertical Intake Playbooks

Generic call answering is weak. Vertical playbooks create quality.

Example playbooks:

### Plumbing

- Leak, clog, water heater, sewer, fixture, emergency
- Ask if water is actively leaking
- Ask if main shutoff has been used
- Ask location and access details
- Escalate severe leaks

### HVAC

- Heating/cooling issue
- Unit type
- System age if known
- No heat/no cooling severity
- Vulnerable occupants if relevant
- Escalate extreme heat/cold scenarios according to business policy

### Roofing

- Leak, storm damage, inspection, replacement
- Ask if active leak exists
- Ask property type
- Ask insurance claim status if business wants it
- Schedule inspection request

### Pool Service

- Maintenance, repair, cleaning, equipment issue
- Ask pool type
- Ask equipment issue
- Ask recurring vs one-time service

### Salon/Pet Grooming

- Service type
- Preferred provider
- Preferred date/time
- New vs returning customer
- Cancellation/deposit rules

Vertical playbooks help the service feel knowledgeable, not generic.

## 5.4 Differentiation Layer 4: Safe Escalation

The system should distinguish between:

- Routine lead
- Scheduling request
- Pricing question
- Existing customer issue
- Urgent request
- Emergency escalation
- Out-of-scope request
- Angry customer or complaint

Urgent calls should follow business-approved escalation rules. The product should never invent emergency policies. The business defines what counts as urgent and who receives escalation.

## 5.5 Differentiation Layer 5: Structured Lead Intelligence

The business should receive more than a transcript. The product should produce a structured, useful lead record.

This is where intelligence matters.

Each call should produce:

- Summary
- Lead score
- Urgency level
- Service category
- Suggested follow-up
- Missing information
- Caller sentiment
- Callback priority
- Appointment preference
- Whether business action is required

## 5.6 Differentiation Layer 6: Weekly ROI Reporting

Retention will depend on showing value.

Each business should receive a weekly report:

- Total calls covered
- Qualified leads captured
- Urgent calls escalated
- Appointment requests
- Missed/spam calls filtered
- Estimated opportunity value if configured
- Response time metrics
- Follow-up status if tracked

This turns the product from a cost into a visible revenue recovery tool.

## 5.7 Differentiation Layer 7: Human Fallback Option

For premium tiers, offer human fallback for edge cases:

- Angry customer
- High-value caller
- Low-confidence conversation
- Sensitive intake
- Complex scheduling
- Emergency ambiguity

This helps overcome the trust barrier.

---

# 6. Basic Expectations From the Business

Even with done-for-you onboarding, the business must provide or approve certain information.

## 6.1 Required Business Setup

The business must confirm:

- Business name
- Main phone number
- Service area
- Business hours
- Coverage hours desired
- Services offered
- Services not offered
- Emergency policy
- Escalation contact
- Preferred lead delivery method
- Whether scheduling is allowed
- Whether pricing can be discussed
- Approved greeting and tone

## 6.2 Service Rules

The business should define:

- Which calls are urgent
- Which calls should be escalated
- Which calls should wait for next business day
- Which services require inspection before quote
- Whether ballpark pricing is allowed
- Whether deposits are required
- Whether the business accepts new customers
- Geographic limits
- Minimum job size if applicable

## 6.3 Calendar and Scheduling Rules

If scheduling is enabled, the business must define:

- Calendar provider
- Appointment types
- Appointment duration
- Service windows
- Buffer time
- Available staff/crews
- Booking restrictions
- Same-day rules
- Rescheduling/cancellation policy

## 6.4 Data and Consent Rules

The business must approve:

- Whether calls are recorded
- Whether transcripts are stored
- Retention period
- Privacy language
- Whether customers receive SMS/email confirmations
- Data deletion preferences

---

# 7. Product Requirements

## 7.1 Product Goals

The product must:

1. Answer inbound calls when the business cannot.
2. Represent the business accurately using approved information.
3. Capture customer details and service intent.
4. Qualify the lead using vertical-specific questions.
5. Identify urgency and escalate when needed.
6. Send structured summaries to the business.
7. Support simple onboarding for non-technical businesses.
8. Provide reporting that proves captured value.
9. Protect customer data and reduce liability.
10. Scale across multiple businesses and call volumes.

## 7.2 Non-Goals for MVP

The MVP should not try to do everything.

Avoid in MVP (locked by `STRATEGY.md` and design doc):

- Verticals beyond **HVAC and plumbing** — roofing, electrical, garage door, pest control, pool, landscaping, salon, professional services, and care services are all v1.1+ candidates. The other home-service verticals listed in §2.1 remain part of the long-term roadmap, not the MVP scope.
- ServiceTitan integration (v1.1 — certification window burns the build runway)
- SMS notifications and SMS-based escalation (v1.1 — MVP escalation is Retell outbound + warm transfer; owner notifications are email-only)
- Twilio voice integration (telephony is Retell-only at MVP)
- Self-serve onboarding (white-glove only for first 50 logos)
- Deep CRM integrations beyond Jobber, Housecall Pro, and Zapier/Make
- Fully automated quoting for all industries
- Full payment processing
- Advanced cross-selling
- Multi-language support (English only)
- Staffed 24/7 human fallback (priced add-on later)
- Deep analytics beyond basic call/lead reporting
- Complex franchise/multi-location management
- Replacing the customer's existing CRM, dispatch, or scheduling tool

## 7.3 User Roles

### Business Owner/Admin

Can:

- Set up business profile
- Approve extracted business information
- Set call coverage rules
- Configure escalation
- View lead summaries
- View reports
- Manage billing

### Staff/Dispatcher

Can:

- View incoming leads
- Mark follow-up status
- Add notes
- Claim/assign leads
- Update appointment outcome

### On-Call Contact

Can:

- Receive urgent escalation
- Acknowledge urgent lead
- Call customer back

### Platform Admin

Can:

- Manage tenant setup
- Review onboarding extraction
- Monitor call quality
- Handle support
- Manage billing/tier limits

## 7.4 MVP Functional Requirements

### FR1: Business Onboarding

The system shall allow a new business to create a profile with minimal manual input.

Required capabilities:

- Enter business website URL
- Enter business name and phone number
- Extract business information from public sources where possible
- Draft business profile automatically
- Display extracted services, hours, service area, and policies for review
- Ask only unresolved questions
- Allow business owner to edit and approve information

Acceptance criteria:

- Business profile can be created without technical setup.
- Business can approve or edit extracted information.
- Missing critical fields are clearly flagged.

### FR2: Call Forwarding Setup

The system shall provide instructions for forwarding calls to the service.

Required capabilities:

- Provide forwarding number
- Support coverage modes:
  - After-hours only
  - Weekend only
  - Overflow after no answer
  - Always-on coverage
- Provide simple setup instructions by phone provider where possible

Acceptance criteria:

- Business can route calls to the system.
- Coverage mode is visible in dashboard.
- Test call can verify setup.

### FR3: Business Knowledge Profile

The system shall maintain an approved business knowledge profile.

Required fields:

- Business name
- Greeting
- Services offered
- Services not offered
- Service area
- Hours
- Coverage hours
- Emergency rules
- Escalation contacts
- Scheduling rules
- Pricing policy
- Lead delivery preferences

Acceptance criteria:

- Agent only answers using approved business profile.
- Business can update profile.
- Changes are versioned or logged.

### FR4: Inbound Call Handling

The system shall answer inbound calls using the business-approved greeting and rules.

Required capabilities:

- Answer calls promptly
- Identify caller intent
- Ask relevant qualification questions
- Capture contact information
- Provide basic business information
- Avoid unsupported claims
- Transfer/escalate when required
- End call professionally

Acceptance criteria:

- Call produces a structured lead record.
- Call follows business-specific rules.
- Unsupported questions trigger safe fallback.

### FR5: Lead Capture

The system shall capture structured lead data.

Required fields:

- Caller name
- Phone number
- Email if provided
- Service category
- Description of issue/request
- Service address or location
- Urgency level
- Preferred appointment window
- New vs existing customer if known
- Summary
- Transcript if enabled
- Recommended next action

Acceptance criteria:

- Lead record is created after each qualified call.
- Missing fields are marked clearly.
- Business receives the lead in selected channels.

### FR6: Urgency Detection and Escalation

The system shall identify urgent calls based on business-approved rules.

Required capabilities:

- Classify urgency using rule-driven scaffolds per vertical (not free-form LLM judgment — see design doc R10)
- Escalate urgent calls to configured contact via Retell outbound call + warm transfer (MVP escalation channel)
- Send email alert; SMS alert deferred to v1.1
- Mark lead as urgent
- Log escalation attempt and result (timestamp, target number, ring duration, outcome)

Acceptance criteria:

- Urgent call triggers escalation.
- Non-urgent call does not wake on-call contact unless rules require it.
- Business can review escalation history.

### FR7: Lead Delivery

The system shall deliver lead summaries to the business.

Delivery methods for MVP:

- Email (primary owner-facing channel at MVP)
- Dashboard
- Direct integrations: Jobber, Housecall Pro
- Zapier/Make webhook (covers HubSpot, Slack, Google Sheets, and the long tail)
- CSV export

SMS notification is deferred to v1.1 — see design doc and §4.3 above. ServiceTitan integration is also v1.1.

Acceptance criteria:

- Lead summary is delivered shortly after call completion.
- Urgent leads are clearly marked.
- Business can access lead history.

### FR8: Dashboard

The system shall provide a simple dashboard for the business.

Required dashboard views:

- Recent calls
- New leads
- Urgent leads
- Lead details
- Call summary
- Transcript if enabled
- Follow-up status
- Weekly report
- Plan usage

Acceptance criteria:

- Business can review all captured leads.
- Business can mark lead as contacted/booked/lost/spam.
- Business can see call volume and plan usage.

### FR9: Basic Reporting

The system shall provide basic performance reporting.

Metrics:

- Total calls covered
- Qualified leads
- Urgent escalations
- Appointment requests
- Spam/wrong-number calls
- Missed/failed calls
- Follow-up status
- Estimated value if configured

Acceptance criteria:

- Weekly report can be sent automatically.
- Business can see value delivered.

### FR10: Privacy and Data Controls

The system shall minimize liability and protect customer data.

Required capabilities:

- Clear disclosure/consent approach as required
- Configurable recording setting
- Configurable transcript retention
- Encryption at rest and in transit
- Tenant-level data isolation
- Role-based access
- Data deletion capability
- Audit logs for sensitive actions

Acceptance criteria:

- Business can configure retention settings.
- Data is separated by tenant.
- Admin access is controlled.

## 7.5 Future Functional Requirements

### Calendar Integration

Support:

- Google Calendar
- Microsoft Outlook Calendar
- Calendly if useful
- Appointment type rules
- Booking confirmation
- Rescheduling/cancellation

### CRM and Field Service Integrations

Potential integrations:

- HubSpot
- Salesforce
- Jobber
- Housecall Pro
- ServiceTitan
- Monday.com
- Google Sheets
- Zapier/Make

### SMS Follow-Up

Capabilities:

- Send confirmation text to caller
- Send appointment reminders
- Request missing info
- Send business callback confirmation

### Cross-Sell / Upsell Logic

Only after business approval:

- Suggest related services
- Capture interest in add-ons
- Include cross-sell opportunities in summary

### Human Fallback

Capabilities:

- Route difficult calls to human operator
- Human review of low-confidence summaries
- Premium coverage tier

### Multi-Location Support

Capabilities:

- Separate service areas
- Separate phone numbers
- Separate escalation paths
- Location-level reporting

---

# 8. Non-Functional Requirements

## 8.1 Reliability

The system must be highly reliable because it is handling live customer calls. Downtime directly affects customer trust and business revenue.

Requirements:

- High uptime target
- Graceful fallback to voicemail or backup message
- Monitoring and alerting
- Call failure logging

## 8.2 Scalability

The system must support multiple businesses and concurrent calls.

Requirements:

- Multi-tenant architecture
- Usage-based scaling
- Concurrent call handling
- Plan-based limits
- Burst handling for peak periods

## 8.3 Latency

The caller experience must feel natural.

Requirements:

- Fast response time
- Minimal awkward pauses
- Smooth interruption handling
- Natural turn-taking

## 8.4 Security

Requirements:

- Encryption in transit
- Encryption at rest
- Tenant isolation
- Least-privilege admin access
- Secure credential handling
- Audit logging

## 8.5 Compliance and Risk Management

Requirements:

- Call recording consent policy
- Data retention policy
- Terms of service
- Business responsibility for approved scripts/rules
- Clear limitation of emergency/medical/legal advice
- Human escalation for sensitive situations

## 8.6 Usability

The product must be simple enough for non-technical business owners.

Requirements:

- Setup wizard
- Plain-English settings
- Minimal required configuration
- Mobile-friendly dashboard
- SMS/email-first workflows
- No complex admin burden

---

# 9. MVP Scope

The MVP should prove one thing:

> Can we help a local service business capture valuable calls it would otherwise miss?

## MVP Included

- Two verticals only: **HVAC and plumbing** (Austin beachhead)
- White-glove (founder-led) tenant onboarding for the first 50 logos — website + Google Business Profile extraction drafts the profile, the demo doubles as the kickoff (one consolidated call with a pre-demo profile extractor) so the tenant goes live in the same session
- Approved service list / hours / service area / urgency rules / escalation contact
- Retell-provisioned phone number + carrier call-forwarding setup assistance
- Inbound call answering (Retell voice runtime)
- Vertical-specific lead qualification (HVAC + plumbing playbooks)
- Rule-driven urgency detection
- Urgent escalation via Retell outbound call + warm transfer (no SMS at MVP)
- Email lead summary
- Lead delivery to Jobber, Housecall Pro, and Zapier/Make webhook
- Simple dashboard (Next.js on Vercel, Supabase Auth + RLS)
- Weekly ROI report (email)
- Flat-rate billing across $79 / $179 / $349 tiers with $0.49 overage and no escalation fees

## MVP Excluded

- Verticals beyond HVAC and plumbing
- ServiceTitan, HubSpot, Salesforce, Monday.com integrations (v1.1)
- SMS — caller confirmations, owner alerts, and escalation SMS are all deferred to v1.1
- Twilio voice integration (Retell-only)
- Self-serve onboarding flow
- Full calendar booking across many systems
- Automated quoting
- Payment collection
- Advanced upselling
- Complex multi-location support
- Full human fallback operation

---

# 10. Success Metrics

## Product Metrics

- Calls answered
- Qualified leads captured
- Urgent calls escalated correctly
- Average call handling time
- Lead summary accuracy
- Caller completion rate
- Business follow-up rate
- Business retention

## Business Metrics

- Trial-to-paid conversion
- Monthly recurring revenue
- Gross margin per account
- Average revenue per account
- Churn
- Overage revenue
- Customer acquisition cost
- Payback period

## Customer Value Metrics

- Leads captured outside normal business hours
- Jobs booked from covered calls
- Revenue attributed to covered calls
- Reduction in missed calls
- Owner time saved
- Customer response time improvement

---

# 11. Risks and Mitigations

## Risk 1: Market Crowding

Many AI receptionist and answering services already exist.

Mitigation:

- Do not compete generically.
- Focus on local service verticals.
- Emphasize done-for-you setup.
- Sell recovered jobs, not AI.

## Risk 2: Trust Barrier

Business owners may worry that an automated voice will mishandle customers.

Mitigation:

- Provide test calls.
- Provide approved scripts.
- Offer escalation rules.
- Add human fallback later.
- Start with low-risk call flows.

## Risk 3: Poor Voice Experience

If the voice sounds robotic or awkward, customers may hang up.

Mitigation:

- Prioritize natural turn-taking.
- Test real calls.
- Keep calls focused.
- Avoid over-answering.
- Escalate uncertainty.

## Risk 4: Onboarding Friction

If setup takes too long, SMBs will not finish.

Mitigation:

- Done-for-you setup.
- Public data extraction.
- Ask only missing questions.
- Use defaults by vertical.

## Risk 5: Liability From Bad Advice

The agent could provide incorrect pricing, policy, emergency, legal, medical, or technical advice.

Mitigation:

- Use approved business knowledge only.
- Avoid definitive claims when not approved.
- Use safe fallback language.
- Escalate urgent/sensitive calls.

## Risk 6: Bad Unit Economics

Voice calls, AI processing, onboarding, and support can cost more than expected.

Mitigation:

- Avoid too-low pricing.
- Set usage limits.
- Charge overages.
- Automate onboarding.
- Monitor cost per call and margin.

---

# 12. Recommended Next Step for Design Phase

**Status (2026-05-03): This phase has completed.** See `docs/brainstorms/requesthandoff-design-requirements.md` for the locked technical design covering all 13 areas listed below.

The 13 areas the design spec was scoped to cover (preserved as historical context):

1. System architecture
2. Telephony provider
3. Voice agent runtime
4. Multi-tenant business profile model
5. Knowledge ingestion pipeline
6. Call flow orchestration
7. Escalation service
8. Lead summary generation
9. Dashboard/backend service
10. Data storage and retention
11. Security and compliance model
12. Billing and usage metering
13. Monitoring and reliability

The key design principle was:

> Build a narrow but excellent intake engine first, then expand into scheduling, integrations, and advanced automation after customer value is proven.

---

# 13. One-Paragraph Product Summary

RequestHandoff is a call coverage and lead intake service for local service businesses. It answers customer calls when the business cannot — during busy hours, nights, weekends, or overflow — captures the caller's need, qualifies the opportunity, escalates urgent requests, and sends the business a structured follow-up summary delivered into the tools they already use. The MVP starts with HVAC and plumbing owner-operators in the Austin metro beachhead, where missed calls often mean lost jobs; roofing, electrical, garage door, pest control, pool, and landscaping are v1.1 expansion verticals. The customer-facing value proposition is simple: every call covered, every lead captured, and fewer customers lost to competitors — at a flat monthly price ($79 / $179 / $349) with no per-call escalation fees. The backend may use AI, but the product should be sold as a reliable business service that helps local companies recover revenue without hiring extra front-office staff or switching CRMs.

