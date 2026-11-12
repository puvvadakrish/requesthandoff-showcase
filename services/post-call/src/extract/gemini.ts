/**
 * Vertex AI Gemini 3 Flash extraction (plan U10).
 *
 * Pinned model id (R15) + responseSchema = JSON-valid output.
 * Failure path: retry once with a corrective prompt; second-try failure routes
 * to the manual-review queue and emits a Sev-3 Sentry event for founder review.
 *
 * Per-call cost telemetry (round 1 finding #11) is recorded against `calls`:
 *   - input/output token counts
 *   - cached token count (charged at ~10% of input price per Vertex AI)
 * Outbound transfer minutes accrue separately on the calls row from the Retell
 * webhook payload (services/voice/src/runtime/retell.ts).
 */
import { LeadExtractionSchema, type LeadExtraction } from "@requesthandoff/schema";

import { logger } from "../observability/logger.js";
import {
  buildCorrectivePrompt,
  buildExtractionUserMessage,
  EXTRACTION_SYSTEM_PROMPT,
  FEW_SHOT_EXAMPLES,
  GEMINI_MODEL_ID,
  PROMPT_VERSION,
} from "./prompt.js";

/**
 * Minimal Gemini client interface. The real implementation calls
 * `@google-cloud/vertexai` GenerativeModel.generateContent with `responseSchema`
 * + `responseMimeType: 'application/json'`. Test doubles pass a fake.
 */
export interface GeminiClient {
  generate(args: {
    model: string;
    systemPrompt: string;
    fewShotExamples: { transcript: string; extraction: object }[];
    userMessage: string;
    cacheKey: string;
    responseSchema: object;
  }): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  }>;
}

export interface ExtractionContext {
  transcript: string;
  tenant: {
    business_name: string;
    vertical: string;
    services_offered: string[];
    services_not_offered: string[];
    coverage_zip_codes: string[];
  };
  urgencyRulesAtCallTime: { phrase: string; severity: string; description?: string }[];
  recommendedActionIds: string[];
}

export interface ExtractionResult {
  status: "ok" | "manual_review";
  lead?: LeadExtraction;
  validationError?: string;
  costTelemetry: {
    input_tokens: number;
    output_tokens: number;
    cached_tokens: number;
    attempts: number;
  };
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    caller_name: { type: ["string", "null"] },
    caller_phone: { type: ["string", "null"] },
    caller_email: { type: ["string", "null"] },
    caller_address: { type: ["string", "null"] },
    service_category: { type: "string" },
    issue_description: { type: "string" },
    location: { type: ["string", "null"] },
    urgency_level: { type: "string", enum: ["standard", "elevated", "urgent"] },
    urgency_confidence: { type: "number", minimum: 0, maximum: 1 },
    preferred_window: { type: ["string", "null"] },
    recommended_action: { type: "string" },
    recommended_action_confidence: { type: "number", minimum: 0, maximum: 1 },
    missing_information: { type: "array", items: { type: "string" } },
    call_confidence_score: { type: "number", minimum: 0, maximum: 1 },
    rule_match_known: { type: "boolean" },
  },
  required: [
    "service_category",
    "issue_description",
    "urgency_level",
    "urgency_confidence",
    "recommended_action",
    "recommended_action_confidence",
    "missing_information",
    "call_confidence_score",
    "rule_match_known",
  ],
};

export async function extractLead(
  client: GeminiClient,
  ctx: ExtractionContext,
): Promise<ExtractionResult> {
  const userMessage = buildExtractionUserMessage({
    transcript: ctx.transcript,
    tenantContext: {
      ...ctx.tenant,
      urgency_rules_at_call_time: ctx.urgencyRulesAtCallTime,
      recommended_action_ids: ctx.recommendedActionIds,
    },
  });

  // First attempt
  const first = await client.generate({
    model: GEMINI_MODEL_ID,
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    fewShotExamples: FEW_SHOT_EXAMPLES,
    userMessage,
    cacheKey: `${PROMPT_VERSION}:${GEMINI_MODEL_ID}`,
    responseSchema: RESPONSE_SCHEMA,
  });

  const firstParsed = tryParseAndValidate(first.text);
  if (firstParsed.success) {
    return {
      status: "ok",
      lead: firstParsed.data,
      costTelemetry: {
        input_tokens: first.inputTokens,
        output_tokens: first.outputTokens,
        cached_tokens: first.cachedTokens,
        attempts: 1,
      },
    };
  }

  logger.warn(
    { error: firstParsed.error, attempts: 1 },
    "extraction first attempt failed schema validation; retrying with corrective prompt",
  );

  // Second attempt with corrective prompt
  const corrective = buildCorrectivePrompt(userMessage, firstParsed.error);
  const second = await client.generate({
    model: GEMINI_MODEL_ID,
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    fewShotExamples: FEW_SHOT_EXAMPLES,
    userMessage: corrective,
    cacheKey: `${PROMPT_VERSION}:${GEMINI_MODEL_ID}`,
    responseSchema: RESPONSE_SCHEMA,
  });

  const secondParsed = tryParseAndValidate(second.text);
  const totalCost = {
    input_tokens: first.inputTokens + second.inputTokens,
    output_tokens: first.outputTokens + second.outputTokens,
    cached_tokens: first.cachedTokens + second.cachedTokens,
    attempts: 2,
  };

  if (secondParsed.success) {
    return { status: "ok", lead: secondParsed.data, costTelemetry: totalCost };
  }

  logger.error(
    { error: secondParsed.error, attempts: 2 },
    "extraction failed after retry; routing to manual-review queue (Sev-3)",
  );

  return {
    status: "manual_review",
    validationError: secondParsed.error,
    costTelemetry: totalCost,
  };
}

function tryParseAndValidate(
  text: string,
): { success: true; data: LeadExtraction } | { success: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (err) {
    return { success: false, error: `JSON parse failed: ${(err as Error).message}` };
  }
  const parsed = LeadExtractionSchema.safeParse(json);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
        .join("; "),
    };
  }
  return { success: true, data: parsed.data };
}
