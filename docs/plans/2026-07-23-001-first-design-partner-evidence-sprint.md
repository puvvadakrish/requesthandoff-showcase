# First Design-Partner Evidence Sprint

> Note: files under `docs/discovery/` hold prospect research and live in a private repo. They are not part of this public copy.

Created: 2026-07-23

## Purpose

RequestHandoff has locally and synthetically demonstrated parts of its call-to-handoff journey, but it has not completed a conversation with an Austin-area home-service owner in the launch wedge. The next priority is therefore customer evidence, not additional product development.

This sprint will test whether owner-operators recognize recurring missed-call pain, accept a structured handoff into an existing tool, can define trustworthy escalation boundaries, and would conditionally pilot RequestHandoff after the canonical safety gates close.

## Outcomes

### Product-validation outcome

Complete five conversations with eligible Austin-area home/property service owner-operators and determine whether the launch wedge passes the repository's first customer-evidence gate.

### Design-partner outcome

Identify at least one qualified owner who:

- confirms recurring missed-call revenue or operational pain;
- approves a concrete missed-call intake and handoff workflow;
- names an existing destination where a structured lead would be useful;
- can describe a safe forwarding or separate-number test with a clear rollback;
- has no MVP-breaking disqualifier; and
- is conditionally willing to run a bounded pilot after the safety gates in this plan close.

### Decision outcome

End with one explicit decision:

1. **Pass:** proceed to pilot-readiness planning for the qualified design partner.
2. **Partial:** close the five-conversation batch with one exact missing signal.
3. **Recruitment-blocked:** close at the timebox with insufficient conversations and make no product inference.
4. **Reconsider:** revisit the launch wedge or promise because the completed evidence gate failed.

No decision in this sprint authorizes implementation, outreach automation, live-provider changes, or a pilot.

## Scope

### In scope

- Five completed conversations with Austin-area home/property service owner-operators that match the canonical buyer profile: 1–10 employees and no dedicated front desk.
- Founder-led recruitment and conversations after separate outreach authorization.
- The existing home/property candidate pool in the [prospect tracker](../discovery/2026-06-first-batch/prospect-tracker.md).
- The existing [owner interview script](../operations/owner-interview-script.md), [discovery scorecard](../operations/discovery-scorecard.md), and HP scorecard field structure.
- Evidence about missed-call pain, current phone handling, handoff destination, required lead fields, owner-defined urgency, forwarding comfort, flat-rate trust, and conditional pilot intent.
- One owner-approved missed-call workflow for the strongest qualified and willing design-partner candidate; retain other strong-fit owners only as backups.
- A redacted, aggregate evaluation against the [customer evidence gates](../operations/customer-evidence-gates.md).

### Out of scope

- Product features, bug fixes, refactors, integrations, or deployment changes.
- Live calls, call forwarding, demos, provider access, hosted verification, or pilot activation.
- Automated, bulk, or AI-placed outreach.
- Mobile/vehicle, appointment-based, gym, restaurant, professional-service, or Outpost discovery.
- Changing `STRATEGY.md`, pricing, or the MVP from one conversation.
- Booking, dispatch, calendar write-back, quoting, payment, SMS, CRM replacement, or a DIY workflow builder.
- Creating prospect-specific Retell agents or changing the shared demo architecture.
- Committing personal contact details, detailed interview notes, recordings, transcripts, or attributable owner quotes.

## Existing Assets and Ownership

Use the existing artifacts as follows; do not create parallel templates.

| Artifact | Role in this sprint |
|---|---|
| [Prospect tracker](../discovery/2026-06-first-batch/prospect-tracker.md) | Canonical desk-research candidate inventory. Post-contact state stays private. |
| [HP scorecards](../discovery/2026-06-first-batch/scorecards/HP-01.md) | Field structure for private interview notes; existing tracked files remain free of interview content. |
| [Owner interview script](../operations/owner-interview-script.md) | Conversation guide; use selectively rather than reading it as a questionnaire. |
| [Discovery scorecard](../operations/discovery-scorecard.md) | Qualification rubric, scoring anchors, and disqualifiers. |
| [Customer evidence gates](../operations/customer-evidence-gates.md) | Minimum wedge-validation thresholds. |
| [GTM playbook](../../GTM-PLAYBOOK.md) | Current pricing anchors; use as hypotheses, not validated economics. |
| [Demo-to-first-logo playbook](../operations/demo-to-first-logo-playbook.md) | Governs any later demo or design-partner transition; not executed in this sprint. |
| [First-live-pilot runbook](../operations/first-live-pilot-runbook.md) | Defines future pilot configuration, rehearsal, monitoring, and rollback; not executed in this sprint. |
| [Pre-first-logo checklist](../operations/pre-first-logo-checklist.md) | Canonical readiness gate before any later live-pilot authorization. |
| [Compliance stance](../operations/compliance-stance.md) | Defines current disclosure, recording, and legal-review boundaries. |
| [Failure-mode contract](../operations/failure-mode-contract.md) | Defines the reliability promises that must be true before live forwarding. |

## Evidence and Privacy Boundary

### Evidence classes

Keep these categories separate in the synthesis:

- **Desk research:** public evidence used only to prioritize candidates. It does not prove pain, workflow, forwarding readiness, or willingness to pilot.
- **Owner-reported evidence:** facts and language from a completed conversation. This is the evidence counted by the sprint.
- **Workflow approval:** an owner explicitly confirms the proposed coverage, intake, urgency, destination, and rollback shape.
- **Conditional pilot intent:** the owner is a pilot decision-maker, approves the bounded pilot shape, explicitly agrees to run it once the canonical safety gates close, permits recontact at a privately recorded time, and identifies any remaining preconditions. Demo curiosity or willingness merely to consider an unspecified future pilot does not count.
- **Synthetic or internal proof:** product tests, founder demonstrations, and hosted technical checks. These do not count toward the five conversations or customer-evidence gate.

### Storage rules

- Before outreach, approve one founder-controlled, private, non-git record system. Privately document its access owner, encryption and sharing controls, backup/export behavior, retention deadline, deletion and candidate-withdrawal triggers, and incident-response owner. Do not collect contact or interview data until this gate is complete.
- Use the existing scorecard fields as the structure for that private record rather than committing filled scorecards.
- Do not commit phone numbers, personal email addresses, recordings, transcripts, attributable quotes, production identifiers, or caller information.
- Keep all post-contact candidate status, next actions, and relationship data in the private sprint record. Leave the tracked prospect tracker as the desk-research inventory.
- A later repository synthesis may contain aggregate counts and carefully anonymized themes only. It must not contain details that identify an owner through quotation, unusual workflow facts, or combinations of attributes.
- Do not paste sensitive notes into agent prompts, issue trackers, CI logs, or pull-request descriptions.
- Do not audio/video record or automatically transcribe sprint conversations. Use minimized contemporaneous notes in the approved private record system.

## Candidate Queue

The sprint seeks five **completed conversations**, not merely five outreach attempts.

### Primary queue

Start with HP-01 through HP-05 from the existing prospect tracker. This preserves the launch wedge while sampling urgent and phone-dependent home-service workflows without adding a new segment.

### Backup queue

Use HP-06 through HP-10 when a primary candidate is unreachable, ineligible, declines, or cannot schedule within the timebox.

### Eligibility screen

Before counting a conversation, verify that the operator:

- serves the Austin metro;
- operates a home/property service business;
- is owner-operated or has an owner directly involved in call handling;
- has 1–10 employees and no dedicated front desk;
- can discuss the current phone and lead-follow-up workflow; and
- is not already disqualified by requiring RequestHandoff to become the booking, payment, CRM, or dispatch system.

Operators outside that profile may be retained as non-counting market context, but they cannot satisfy the five-conversation evidence gate.

Do not add adjacent segments to fill the quota. If fewer than five eligible conversations can be completed from the existing ten candidates, record recruitment as the bottleneck and decide whether to extend home-service sourcing separately.

## Conversation Contract

### Format

- Founder-led, approximately 20–30 minutes.
- Discovery first; do not lead with AI or spend the session delivering a product pitch.
- Use the owner interview script and discovery scorecard as the canonical field and scoring sources; do not create a competing questionnaire.
- Elicit the current phone workflow and a concrete recent consequence of an unanswered call before describing RequestHandoff, positioning, or pricing. Label later answers as prompted; only an unprompted concrete consequence counts toward the three-of-five pain gate.
- Do not state industry missed-call percentages, revenue-loss amounts, setup times, margins, or customer outcomes as facts about the owner's business.
- Clarify that RequestHandoff is a handoff layer, not a booking, dispatch, quoting, payment, or CRM replacement system.
- Discuss pricing as a hypothesis: published tier, transparent overage, and no escalation surcharge. Do not promise an invariant monthly bill when usage overage exists.

Within one business day, complete the private scorecard using the existing fields and 1–5 anchors, label prompted evidence, record any disqualifier, and assign the next action. Do not infer missing answers from the business website.

## Design-Partner Qualification

A candidate qualifies only when the existing scorecard yields at least 21 with no disqualifier and these sprint-specific conditions are also true:

- Austin home/property service with 1–10 employees, no dedicated front desk, and an owner involved in call handling.
- Recurring missed-call pain is described in the owner's own terms.
- A structured lead has a specific existing destination and does not require system-of-record replacement.
- Urgency and escalation are business-defined rather than invented by RequestHandoff.
- A forwarding or separate-number test appears feasible and reversible.
- The owner approves the sprint-specific workflow delta below.
- The owner meets the conditional-pilot-intent definition above.
- The owner accepts at least one current published tier, the transparent overage, and no escalation surcharge as a credible post-pilot price hypothesis if the pilot shows value. This is not a billing commitment or paid-pilot authorization.

Interest in AI, a demo request, or a high score without workflow approval is insufficient.

## Owner-Approved Missed-Call Workflow

For the strongest qualified and willing candidate, privately complete the business-configuration and rollback fields already defined by the first-live-pilot runbook. Obtain explicit owner approval of the resulting coverage trigger, disclosure, service boundaries, intake fields, urgency/escalation rules, existing handoff destination, follow-up owner, bounded routing mode, and rollback. Do not create workflows for backup candidates unless the selected candidate withdraws.

Approval validates the desired workflow only. It does not authorize provider configuration or live traffic.

## Named Safety Gates Before a Pilot

The pre-first-logo checklist, pilot runbook, compliance stance, and failure-mode contract remain the canonical internal gate set; this plan does not duplicate or weaken them. Explain the boundary to a candidate in owner-facing terms:

- handoffs cannot be silently lost or duplicated;
- escalation must behave as approved and be visible, or remain disabled and unpromised;
- caller information must follow agreed access, retention, and deletion rules;
- the exact configuration and destination must pass the documented rehearsal; and
- the owner can stop routing immediately while the founder monitors the bounded window.

The founder maps these assurances to the canonical internal gates. The owner is not asked to evaluate implementation concepts such as idempotency, RLS, or provider configuration. Conditional pilot intent is valid only after all applicable canonical gates close; the sprint does not close, prioritize, waive, implement, or test them.

## Sequence and Timebox

The fixed batch closes when five eligible conversations are complete or ten business days have elapsed, whichever comes first. The clock starts only after outreach is separately authorized, the private record protocol is approved, and the primary candidates have a privately verified owner contact and permitted one-to-one channel.

### Stage 1 — Prepare the queue

- Confirm the existing HP-01 through HP-10 records are sufficient to identify the public business and apply the eligibility screen.
- Keep private contact research, post-contact status, and next actions outside git.
- Complete the private record protocol before collecting contact or interview data.
- Do not create demos or provider configuration to earn a conversation.

### Stage 2 — Recruit and schedule

- Use founder-led, one-to-one contact only.
- Use a concise founder-authored discovery ask that makes no unsupported claims. Permit no more than two manual follow-ups over five business days.
- Work the primary queue first and use backups as needed to reach five completed conversations.
- Move declines and ineligible candidates to backups immediately; activate a backup after five business days without a response.
- Track candidate relationships and recruitment state only in the private sprint record.
- Treat non-response as recruitment evidence, not evidence that missed-call pain is absent.

### Stage 3 — Conduct and score conversations

- Complete the conversation contract.
- Finish the private scorecard within one business day.
- Separate owner-reported facts from founder inference.
- Flag disqualifiers immediately; do not invent product work to rescue a poor fit.

### Stage 4 — Complete qualification with the strongest candidate

- Select the strongest candidate who meets every qualification criterion except workflow approval and conditional pilot intent.
- Ask that owner to correct and approve the workflow delta.
- Privately record the decision-maker, permitted recontact window, remaining preconditions, pricing response, and explicit conditional agreement to run the bounded pilot after the canonical gates close.
- If the selected candidate declines, repeat with the next strongest qualified backup. Do not configure or schedule a pilot.

### Stage 5 — Synthesize and decide

- Evaluate the pass, partial, and fail rules below.
- Produce the aggregate, anonymized result at `docs/discovery/2026-07-first-design-partner-sprint-readout.md` only if it satisfies the storage rules; do not overwrite the 2026-06 desk-research readout.
- Recommend the next decision without automatically starting a brainstorm, plan, implementation, demo, or pilot.

## Verification and Decision Rules

### Sprint completion

The sprint closes when either five eligible conversations are complete or the ten-business-day timebox expires. At closure:

- every completed conversation has a private scorecard;
- the private recruitment ledger includes every attempted candidate and outcome so negative cases cannot be silently excluded;
- evidence is classified as desk research, owner-reported, workflow-approved, conditional pilot intent, or synthetic/internal;
- aggregate counts can be evaluated without exposing sensitive details; and
- the final decision is recorded as pass, partial, fail, or recruitment-blocked.

Five completed eligible conversations remain mandatory for a pass. A timebox that closes below five is **recruitment-blocked**, not positive or negative product evidence.

### Pass

- Five completed eligible conversations.
- At least three owners confirm recurring missed-call revenue or operational pain.
- At least two owners identify a simple existing handoff destination.
- At least two score 21 or higher with no disqualifier.
- At least one qualifies under the stricter design-partner definition, approves the missed-call workflow, explicitly agrees to run a bounded pilot after the canonical safety gates close, and accepts the current pricing model as a credible post-pilot hypothesis.

### Partial

Use **partial** only after five eligible conversations when some wedge evidence is positive but the pass threshold is not met—for example, destinations remain vague or no owner is ready to approve a workflow. Close this batch and state the exact missing signal. Any additional discovery requires a separately authorized, fixed-size home-services batch with its own precommitted decision rule; later evidence must not retroactively change this sprint's result.

### Fail or rethink

Use **reconsider** when any of these patterns appears:

- fewer than three of five owners recognize meaningful recurring missed-call pain;
- useful value consistently requires booking, dispatch, quoting, payment, or CRM replacement;
- owners cannot identify a destination where a structured lead would be acted on;
- safe forwarding or a separate-number test is unacceptable to every strong-fit owner; or
- no qualified owner accepts the handoff and predictable-pricing proposition.

A failed gate triggers a strategy decision, not compensating feature development.

### Evidence integrity checks

Before claiming a pass, verify:

- each counted statement came from a completed owner conversation;
- estimates remain labeled as estimates;
- no public-page inference was upgraded to owner confirmation;
- demo interest was not upgraded to pilot intent;
- pain confirmations were concrete and elicited before product/pricing framing;
- pilot intent met the explicit decision-maker, workflow, recontact, precondition, safety-gate, and pricing criteria;
- scores follow the existing rubric rather than founder enthusiasm; and
- the synthesis contains no identifying interview details.

## Monitoring, Stop Conditions, and Recovery

### During recruitment and conversations

- Review aggregate progress after conversations two and four without changing the threshold or product scope.
- Monitor for repeated disqualifiers, unsafe compliance expectations, or demand for CRM/dispatch replacement.
- Stop the conversation if the operator begins sharing caller PII, credentials, regulated data, or information not needed for discovery; redirect to workflow-level facts.
- Do not record or automatically transcribe a sprint conversation.

### Stop the sprint early only when

- the founder cannot protect private contact and interview information;
- outreach would require automation, impersonation, or unsupported claims;
- the candidate pool is discovered to be outside the confirmed wedge; or
- a compliance or safety issue makes further conversations inappropriate without qualified guidance.

Otherwise, continue until five eligible conversations are complete or the fixed timebox expires, even if early responses are negative; stopping on favorable or unfavorable anecdotes would bias the result.

### Recovery

- If a primary candidate is unreachable or ineligible, replace them with the next existing HP backup.
- If recruiting cannot produce five eligible conversations, record recruitment as the bottleneck and seek a separate decision on extending home-service sourcing.
- If sensitive information is accidentally placed in a tracked artifact, stop automation and do not stage, commit, push, or paste it elsewhere. Remove it from the working copy without echoing it, notify the founder, and use separately authorized privacy remediation if it reached git history or a third party; do not improvise a history rewrite.

## Responsibilities

| Responsibility | Owner |
|---|---|
| Authorize and perform external outreach | Founder, outside this planning task |
| Verify eligibility and schedule conversations | Founder |
| Conduct conversations | Founder |
| Maintain private contact and scorecard records | Founder |
| Approve workflow facts | Interviewed owner |
| Evaluate evidence gates and recommend next decision | Founder, using repository rubrics |
| Authorize any later demo, provider access, engineering plan, or pilot | Founder through a separate explicit decision |

## Deliverables

1. One private completed scorecard per completed conversation using the existing scorecard structure; five are required for a pass evaluation.
2. One private owner-approved missed-call workflow for the selected design-partner candidate, with other strong-fit owners retained only as backups.
3. One private evidence ledger covering the full recruitment denominator and every completed scorecard, plus one aggregate anonymized readout with the pass, partial, fail, or recruitment-blocked decision.
4. If the sprint passes, one concise candidate-specific scope synthesis for a future pilot-readiness plan, containing no sensitive contact or caller information.

These deliverables do not include code, outreach messages, demos, provider configuration, hosted changes, or pilot activation.

## Post-Sprint Routing

- **Pass:** confirm the candidate-specific pilot scope, then create one bounded pilot-readiness engineering plan. Stop again before `ce-work` or provider access.
- **Partial or recruitment-blocked:** close this batch. Any follow-up requires a separate fixed-size home-services batch for the exact missing signal; do not add features or adjacent segments.
- **Fail:** use a strategy checkpoint before changing positioning, ICP, or product scope.

No route proceeds automatically.
