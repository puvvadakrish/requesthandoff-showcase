import { describe, expect, it, vi } from "vitest";

import { extractLead, type ExtractionContext, type GeminiClient } from "./gemini.js";

const validExtraction = {
  caller_name: "Maria Garcia",
  caller_phone: "+15125550123",
  caller_email: null,
  caller_address: "Round Rock, TX",
  service_category: "AC repair",
  issue_description: "AC stopped working; vulnerable occupant",
  location: "78664",
  urgency_level: "urgent",
  urgency_confidence: 0.95,
  preferred_window: null,
  recommended_action: "warm_transfer_to_owner",
  recommended_action_confidence: 0.9,
  missing_information: ["caller_email"],
  call_confidence_score: 0.92,
  rule_match_known: true,
};

const baseCtx: ExtractionContext = {
  transcript: "Agent: ... Caller: ...",
  tenant: {
    business_name: "Austin HVAC Co",
    vertical: "hvac",
    services_offered: ["AC repair"],
    services_not_offered: [],
    coverage_zip_codes: ["78664"],
  },
  urgencyRulesAtCallTime: [
    { phrase: "no cooling vulnerable occupant", severity: "urgent", description: "AC failure with vulnerable occupant" },
  ],
  recommendedActionIds: ["callback_request", "warm_transfer_to_owner"],
};

describe("extractLead", () => {
  it("returns ok on first valid response", async () => {
    const client: GeminiClient = {
      generate: vi.fn().mockResolvedValue({
        text: JSON.stringify(validExtraction),
        inputTokens: 1200,
        outputTokens: 250,
        cachedTokens: 1000,
      }),
    };
    const result = await extractLead(client, baseCtx);
    expect(result.status).toBe("ok");
    expect(result.lead?.urgency_level).toBe("urgent");
    expect(result.costTelemetry.attempts).toBe(1);
    expect(client.generate).toHaveBeenCalledTimes(1);
  });

  it("retries with corrective prompt when first response fails schema validation", async () => {
    const broken = { ...validExtraction, urgency_confidence: 1.5 }; // out of [0,1]
    const client: GeminiClient = {
      generate: vi
        .fn()
        .mockResolvedValueOnce({
          text: JSON.stringify(broken),
          inputTokens: 1200,
          outputTokens: 250,
          cachedTokens: 1000,
        })
        .mockResolvedValueOnce({
          text: JSON.stringify(validExtraction),
          inputTokens: 1300,
          outputTokens: 240,
          cachedTokens: 1100,
        }),
    };
    const result = await extractLead(client, baseCtx);
    expect(result.status).toBe("ok");
    expect(result.costTelemetry.attempts).toBe(2);
    expect(result.costTelemetry.input_tokens).toBe(2500);
    expect(client.generate).toHaveBeenCalledTimes(2);
  });

  it("routes to manual_review when second attempt also fails", async () => {
    const broken = { ...validExtraction, urgency_level: "wat" };
    const client: GeminiClient = {
      generate: vi.fn().mockResolvedValue({
        text: JSON.stringify(broken),
        inputTokens: 1200,
        outputTokens: 250,
        cachedTokens: 1000,
      }),
    };
    const result = await extractLead(client, baseCtx);
    expect(result.status).toBe("manual_review");
    expect(result.lead).toBeUndefined();
    expect(result.validationError).toBeTruthy();
    expect(result.costTelemetry.attempts).toBe(2);
  });

  it("handles malformed JSON via the parse error path", async () => {
    const client: GeminiClient = {
      generate: vi
        .fn()
        .mockResolvedValueOnce({
          text: "not json at all",
          inputTokens: 1000,
          outputTokens: 100,
          cachedTokens: 800,
        })
        .mockResolvedValueOnce({
          text: JSON.stringify(validExtraction),
          inputTokens: 1100,
          outputTokens: 200,
          cachedTokens: 900,
        }),
    };
    const result = await extractLead(client, baseCtx);
    expect(result.status).toBe("ok");
    expect(result.costTelemetry.attempts).toBe(2);
  });

  it("uses the pinned model + versioned cache key", async () => {
    const client: GeminiClient = {
      generate: vi.fn().mockResolvedValue({
        text: JSON.stringify(validExtraction),
        inputTokens: 1200,
        outputTokens: 250,
        cachedTokens: 1000,
      }),
    };
    await extractLead(client, baseCtx);
    const call = (client.generate as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.model).toBe("gemini-3-flash-preview");
    expect(call.cacheKey).toMatch(/^v\d+\.\d+\.\d+:gemini-3-flash-preview$/);
  });
});
