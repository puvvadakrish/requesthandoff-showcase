---
title: Compliance Stance
date: 2026-06-02
status: draft-not-legal-advice
parent: docs/operations/claude-compound-workflow.md
---

# Compliance Stance

This is RequestHandoff's working compliance stance for MVP planning. It is not legal advice and should be reviewed by an attorney before paid launch or expansion outside Texas.

## MVP Boundary

- Launch jurisdiction: Texas only.
- Launch ICP: local home/property service owner-operators.
- No outbound AI prospecting calls.
- No SMS confirmations or SMS marketing in MVP.
- No health, childcare, senior care, legal, financial, or other regulated intake segments in MVP.
- No human fallback promises unless explicitly sold and staffed later.

## Recording Disclosure

Texas is a one-party consent state for phone-call recording, according to the Texas State Law Library's public FAQ. Even so, RequestHandoff should include a recording disclosure in every greeting for trust and consistency.

Default greeting pattern:

> Hi, this is [Business Name] — for quality, this call may be recorded. How can I help?

## Multi-State / Out-of-Texas Policy

- Do not sell or enable production service outside Texas until state-by-state recording and consent handling is reviewed.
- If an operator serves callers across state lines, use the conservative path: disclose recording at the start of the call and do not rely on Texas-only assumptions.
- Two-party/all-party consent states require specific review before launch.

## TCPA / AI Voice / SMS Stance

The FCC treats AI-generated voices in robocalls as artificial/prerecorded voice under TCPA standards, and FCC materials emphasize prior express consent for many artificial/prerecorded, autodialed, telemarketing, and robotext use cases.

MVP operating stance:

- Inbound calls only: caller initiates the call to the business.
- Warm transfer only when an approved urgency rule fires during an active inbound call.
- No automated outbound marketing calls.
- No robocall campaigns.
- No SMS marketing or automated SMS reminders until TCPA consent, opt-out, and recordkeeping are defined.
- If SMS ships later, support STOP/revocation handling and consent records from day one.

## Regulated Segments

Avoid these until a separate compliance plan exists:

- Medical, dental, therapy, home health, senior care, childcare, and other PHI/safety-sensitive services.
- Legal, tax, financial advice, insurance advice, and other licensed professional intake where callers may disclose sensitive facts.
- Any segment where the agent might be perceived as giving advice rather than collecting intake.

## Data Handling

- Do not log PII in application logs.
- Treat transcripts as sensitive because they may contain names, phone numbers, addresses, and incident details.
- Keep transcript retention at the MVP default unless a tenant-specific policy is reviewed.
- Do not use customer calls in marketing or demos without explicit permission.

## Attorney-Review Triggers

Get legal review before:

- Launching outside Texas.
- Adding SMS.
- Adding outbound calls.
- Entering regulated segments.
- Changing the recording disclosure.
- Offering a public SLA or failure credit.
- Claiming compliance with TCPA, HIPAA, legal ethics, or industry-specific standards.

## Sources

- Texas State Law Library: [Can I legally tape a phone conversation?](https://www.sll.texas.gov/faqs/tape-phone-conversation/)
- FCC: [One-to-One Consent Rule for TCPA Prior Express Written Consent FAQ](https://docs.fcc.gov/public/attachments/DOC-408396A1.pdf)
- FCC: [FCC Makes AI-Generated Voices in Robocalls Illegal](https://docs.fcc.gov/public/attachments/DOC-400393A1.pdf)
