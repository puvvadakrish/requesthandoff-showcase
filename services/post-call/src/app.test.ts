import type { CallRecord, LeadRecord, TenantConfig } from "@requesthandoff/schema";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildPostCallApp,
  createEmailClientFromEnv,
  createGeminiClientFromEnv,
  parseGoogleAuthOptionsFromEnv,
} from "./app.js";
import type { PostCallStorage } from "./pipeline/call-ended.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const callId = "22222222-2222-4222-8222-222222222222";
const leadId = "33333333-3333-4333-8333-333333333333";

describe("buildPostCallApp", () => {
  it("requires the internal worker secret when configured", async () => {
    const app = buildPostCallApp({ ...deps(), webhookSecret: "secret" });

    const response = await app.request("/calls/ended", {
      method: "POST",
      body: JSON.stringify(validPayload()),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("rejects a blank configured worker secret at startup", () => {
    expect(() => buildPostCallApp({ ...deps(), webhookSecret: "   " })).toThrow(
      "webhookSecret cannot be blank",
    );
  });

  it("rejects malformed JSON", async () => {
    const app = buildPostCallApp({ ...deps(), webhookSecret: "secret" });

    const response = await app.request("/calls/ended", {
      method: "POST",
      headers: { "x-requesthandoff-worker-secret": "secret" },
      body: "{nope",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "bad_json" });
  });

  it("rejects payloads that are not Retell call-ended events", async () => {
    const app = buildPostCallApp({ ...deps(), webhookSecret: "secret" });

    const response = await app.request("/calls/ended", {
      method: "POST",
      headers: { "x-requesthandoff-worker-secret": "secret" },
      body: JSON.stringify({ agent_id: "agent_prod_123" }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("bad_payload");
  });

  it("returns the pipeline result on a valid call-ended payload", async () => {
    const app = buildPostCallApp({ ...deps(), webhookSecret: "secret" });

    const response = await app.request("/calls/ended", {
      method: "POST",
      headers: { "x-requesthandoff-worker-secret": "secret" },
      body: JSON.stringify(validPayload()),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; lead_id: string };
    expect(body.status).toBe("delivered");
    expect(body.lead_id).toBe(leadId);
  });
});

describe("createEmailClientFromEnv", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("sends through Brevo when configured", async () => {
    process.env["POST_CALL_EMAIL_PROVIDER"] = "brevo";
    process.env["BREVO_API_KEY"] = "brevo_test_key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: "brevo-message-123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createEmailClientFromEnv();
    const result = await client.send({
      from: "RequestHandoff <leads@requesthandoff.com>",
      to: "owner@example.com",
      subject: "New lead",
      html: "<p>Lead</p>",
      text: "Lead",
      headers: { "X-RequestHandoff-Lead-Id": "lead_123" },
    });

    expect(result).toEqual({ id: "brevo-message-123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({
        method: "POST",
        headers: {
          "api-key": "brevo_test_key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { email: "leads@requesthandoff.com", name: "RequestHandoff" },
          to: [{ email: "owner@example.com" }],
          subject: "New lead",
          htmlContent: "<p>Lead</p>",
          textContent: "Lead",
          headers: { "X-RequestHandoff-Lead-Id": "lead_123" },
        }),
      }),
    );
  });

  it("rejects unsupported email providers at startup", () => {
    process.env["POST_CALL_EMAIL_PROVIDER"] = "smtp";

    expect(() => createEmailClientFromEnv()).toThrow(
      "Unsupported POST_CALL_EMAIL_PROVIDER: smtp",
    );
  });
});

describe("parseGoogleAuthOptionsFromEnv", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns credentials from GOOGLE_APPLICATION_CREDENTIALS_JSON", () => {
    process.env["GOOGLE_APPLICATION_CREDENTIALS_JSON"] = JSON.stringify({
      client_email: "post-call@example.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----\\n",
    });

    expect(parseGoogleAuthOptionsFromEnv()).toEqual({
      credentials: {
        client_email: "post-call@example.iam.gserviceaccount.com",
        private_key: "-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----\\n",
      },
    });
  });

  it("rejects malformed credential JSON at startup", () => {
    process.env["GOOGLE_APPLICATION_CREDENTIALS_JSON"] = JSON.stringify({
      client_email: "post-call@example.iam.gserviceaccount.com",
    });

    expect(() => parseGoogleAuthOptionsFromEnv()).toThrow(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON missing client_email or private_key",
    );
  });
});

describe("createGeminiClientFromEnv", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("uses the Gemini API key path with runtime model override", async () => {
    process.env["GOOGLE_GENAI_API_KEY"] = "google_genai_test_key";
    process.env["GEMINI_MODEL_ID"] = "gemini-3.5-flash";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "{\"ok\":true}" }] } }],
        usageMetadata: {
          promptTokenCount: 12,
          candidatesTokenCount: 5,
          cachedContentTokenCount: 0,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createGeminiClientFromEnv();
    const result = await client.generate({
      model: "gemini-3-flash-preview",
      systemPrompt: "Extract lead data.",
      fewShotExamples: [{ transcript: "Caller: hi", extraction: { ok: true } }],
      userMessage: "Caller transcript",
      cacheKey: "cache-key",
      responseSchema: {
        type: "object",
        properties: { ok: { type: "boolean" }, note: { type: ["string", "null"] } },
        required: ["ok"],
      },
    });

    expect(result).toEqual({
      text: "{\"ok\":true}",
      inputTokens: 12,
      outputTokens: 5,
      cachedTokens: 0,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=google_genai_test_key",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("\"nullable\":true"),
      }),
    );
  });

  it("falls back from Gemini high-demand errors when a fallback model is configured", async () => {
    process.env["GOOGLE_GENAI_API_KEY"] = "google_genai_test_key";
    process.env["GEMINI_MODEL_ID"] = "gemini-3.5-flash";
    process.env["GEMINI_FALLBACK_MODEL_ID"] = "gemini-3-flash-preview";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message:
              "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "{\"ok\":true}" }] } }],
          usageMetadata: {
            promptTokenCount: 12,
            candidatesTokenCount: 5,
            cachedContentTokenCount: 0,
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const client = createGeminiClientFromEnv();
    const result = await client.generate({
      model: "gemini-3-flash-preview",
      systemPrompt: "Extract lead data.",
      fewShotExamples: [{ transcript: "Caller: hi", extraction: { ok: true } }],
      userMessage: "Caller transcript",
      cacheKey: "cache-key",
      responseSchema: { type: "object", properties: { ok: { type: "boolean" } } },
    });

    expect(result.text).toBe("{\"ok\":true}");
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=google_genai_test_key",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=google_genai_test_key",
      expect.any(Object),
    );
  });
});

function deps() {
  return {
    storage: new RouteStorage(),
    geminiClient: {
      generate: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          caller_name: "Maria Garcia",
          caller_phone: "+15125550123",
          caller_email: null,
          caller_address: "Round Rock, TX",
          service_category: "AC repair",
          issue_description: "AC stopped working",
          location: "78664",
          urgency_level: "urgent",
          urgency_confidence: 0.95,
          preferred_window: null,
          recommended_action: "warm_transfer_to_owner",
          recommended_action_confidence: 0.9,
          missing_information: [],
          call_confidence_score: 0.92,
          rule_match_known: true,
        }),
        inputTokens: 100,
        outputTokens: 25,
        cachedTokens: 80,
      }),
    },
    emailClient: {
      send: vi.fn().mockResolvedValue({ id: "msg_123" }),
    },
    emailFromAddress: "RequestHandoff <leads@requesthandoff.com>",
  };
}

function validPayload() {
  return {
    event: "call_ended",
    agent_id: "agent_prod_123",
    call_id: "retell_call_123",
    start_timestamp: Date.parse("2026-05-04T12:00:00.000Z"),
    end_timestamp: Date.parse("2026-05-04T12:04:00.000Z"),
    transcript: "Caller: My AC stopped.",
    duration_ms: 240_000,
    inbound_minutes: 4,
    outbound_transfer_minutes: 0,
  };
}

class RouteStorage implements PostCallStorage {
  async resolveTenantFromAgent() {
    return { tenant_id: tenantId, agent_kind: "production" as const };
  }

  async loadTenantConfig(): Promise<TenantConfig> {
    return {
      id: tenantId,
      business_name: "Austin HVAC Co",
      vertical: "hvac",
      secondary_services: [],
      primary_state: "TX",
      plan: "starter",
      status: "active",
      escalation_phone: "+15125550100",
      escalation_email: "owner@example.com",
      greeting_override: "",
      hours: {},
      services_offered: ["AC repair"],
      services_not_offered: [],
      coverage_zip_codes: ["78664"],
      custom_urgency_rules: [],
      created_at: "2026-05-04T12:00:00.000Z",
      updated_at: "2026-05-04T12:00:00.000Z",
    };
  }

  async upsertCompletedCall(args: Parameters<PostCallStorage["upsertCompletedCall"]>[0]): Promise<CallRecord> {
    return {
      id: callId,
      tenant_id: tenantId,
      retell_agent_id: args.retellAgentId,
      retell_call_id: args.retellCallId,
      direction: args.direction,
      status: "completed",
      started_at: args.startedAt,
      ended_at: args.endedAt,
      duration_seconds: args.durationSeconds,
      transcript: args.transcript,
      transcript_retention_days: 90,
      retell_inbound_minutes: args.retellInboundMinutes,
      retell_outbound_transfer_minutes: args.retellOutboundTransferMinutes,
      gemini_input_tokens: 0,
      gemini_output_tokens: 0,
      gemini_cached_tokens: 0,
      resend_sends: 0,
      created_at: "2026-05-04T12:00:00.000Z",
    } as CallRecord;
  }

  async updateCallCostTelemetry() {}

  async upsertLeadForCall(args: Parameters<PostCallStorage["upsertLeadForCall"]>[0]): Promise<LeadRecord> {
    return {
      id: leadId,
      tenant_id: tenantId,
      call_id: args.callId,
      ...args.extraction,
      status: "new",
      attributed_value_usd: null,
      created_at: "2026-05-04T12:05:00.000Z",
      updated_at: "2026-05-04T12:05:00.000Z",
    };
  }

  async findLatestDelivery() {
    return null;
  }

  async recordDelivery() {}
}
