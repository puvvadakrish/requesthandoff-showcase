/**
 * Lead extraction prompt + schema (plan U10 + R15).
 *
 * The system prompt + few-shot examples are stable across calls — they ride
 * on Vertex AI context caching for ~90% prefix discount on the cached portion.
 * The cache key is versioned (`PROMPT_VERSION`) so revisions invalidate the
 * cache cleanly.
 *
 * Pinned model: `gemini-3-flash-preview` (per plan D — preview SLA, ~2-hour
 * migration budget when GA lands).
 */
export const PROMPT_VERSION = "v1.0.0";
export const GEMINI_MODEL_ID = "gemini-3-flash-preview";

export const EXTRACTION_SYSTEM_PROMPT = `You are a structured-data extractor for a phone-call receptionist serving small local businesses in the Austin metro area. You receive a complete English-language call transcript between an AI receptionist and a caller, plus the tenant's business context (vertical, services, hours, urgency rules). You output a single JSON object that matches the response schema exactly.

RULES:
1. NEVER invent information. If a field isn't stated in the transcript, set it to null and add the field name to missing_information.
2. The urgency_level decision must reference an urgency rule that the agent's playbook actually contained at call time. If no rule matched but the caller used emergency language, flag rule_match_known=false and set urgency_level=elevated.
3. Confidence scores reflect YOUR certainty in each field. Below 0.6 = the dashboard surfaces a "review transcript" prompt to the owner.
4. PII fields (caller_name, caller_phone, caller_email, caller_address) are persisted with column-level encryption; output them in plaintext to this response — the storage layer handles encryption.
5. Recommended_action MUST be one of the IDs from the tenant's playbook recommended_actions list. If unsure, output "callback".
6. Do not output anything outside the JSON object — no preamble, no commentary, no markdown fences.`;

export const FEW_SHOT_EXAMPLES = [
  {
    transcript:
      "Agent: Hi, this is Austin HVAC Co — for quality, this call may be recorded. How can I help you today? Caller: Yeah, hi, my AC stopped working and my baby is upstairs. It's like 90 degrees in here. Agent: I'm sorry to hear that. Can I have your name and the best phone number to reach you? Caller: Maria Garcia, 512-555-0123. Agent: Thank you Maria. What's your address? Caller: 1410 Mesa Drive, Round Rock, 78664. Agent: I'm getting an owner on the line for you right now, please hold.",
    extraction: {
      caller_name: "Maria Garcia",
      caller_phone: "+15125550123",
      caller_email: null,
      caller_address: "1410 Mesa Drive, Round Rock, 78664",
      service_category: "AC repair",
      issue_description: "AC stopped working; vulnerable occupant (baby) upstairs; indoor temp ~90F",
      location: "78664",
      urgency_level: "urgent",
      urgency_confidence: 0.95,
      preferred_window: null,
      recommended_action: "warm_transfer_to_owner",
      recommended_action_confidence: 0.95,
      missing_information: ["caller_email", "preferred_window"],
      call_confidence_score: 0.92,
      rule_match_known: true,
    },
  },
  {
    transcript:
      "Agent: Hi, this is Pflugerville Yoga Studio — for quality, this call may be recorded. How can I help you today? Caller: Hi, I was wondering what your morning class schedule looks like next week, and how much a drop-in is. Agent: Sure, I can take down your contact info and have someone follow up with our schedule and pricing. Could I have your name and phone number? Caller: Jamie Park, 737-555-0142. Agent: And the best email if we can't reach you by phone? Caller: jamie.park@example.com. Agent: Thanks Jamie, we'll be in touch by end of day.",
    extraction: {
      caller_name: "Jamie Park",
      caller_phone: "+17375550142",
      caller_email: "jamie.park@example.com",
      caller_address: null,
      service_category: "schedule and pricing inquiry",
      issue_description: "Wants morning class schedule + drop-in pricing",
      location: null,
      urgency_level: "standard",
      urgency_confidence: 0.95,
      preferred_window: null,
      recommended_action: "callback_request",
      recommended_action_confidence: 0.9,
      missing_information: ["caller_address", "preferred_window"],
      call_confidence_score: 0.9,
      rule_match_known: false,
    },
  },
];

interface BuildPromptArgs {
  transcript: string;
  tenantContext: {
    business_name: string;
    vertical: string;
    services_offered: string[];
    services_not_offered: string[];
    coverage_zip_codes: string[];
    urgency_rules_at_call_time: { phrase: string; severity: string; description?: string }[];
    recommended_action_ids: string[];
  };
}

export function buildExtractionUserMessage({ transcript, tenantContext }: BuildPromptArgs): string {
  return [
    `<tenant_context>`,
    `business_name: ${tenantContext.business_name}`,
    `vertical: ${tenantContext.vertical}`,
    `services_offered: ${JSON.stringify(tenantContext.services_offered)}`,
    `services_not_offered: ${JSON.stringify(tenantContext.services_not_offered)}`,
    `coverage_zip_codes: ${JSON.stringify(tenantContext.coverage_zip_codes)}`,
    `urgency_rules_at_call_time: ${JSON.stringify(tenantContext.urgency_rules_at_call_time)}`,
    `recommended_action_ids: ${JSON.stringify(tenantContext.recommended_action_ids)}`,
    `</tenant_context>`,
    ``,
    `<transcript>`,
    transcript,
    `</transcript>`,
  ].join("\n");
}

export function buildCorrectivePrompt(originalUserMessage: string, validationError: string): string {
  return [
    originalUserMessage,
    ``,
    `<previous_response_validation_error>`,
    validationError,
    `</previous_response_validation_error>`,
    ``,
    `Re-emit the JSON object so it validates against the schema. Do not add commentary.`,
  ].join("\n");
}
