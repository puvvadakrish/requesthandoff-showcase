import type {
  CallRecord,
  DeliveryChannel,
  DeliveryStatus,
  LeadRecord,
  TenantConfig,
} from "@requesthandoff/schema";
import { describe, expect, it, vi } from "vitest";

import type { EmailClient } from "../delivery/email.js";
import type { WebhookHttpClient } from "../delivery/webhook-url.js";
import type { GeminiClient } from "../extract/gemini.js";
import {
  handleRetellCallEnded,
  type PostCallStorage,
  type RetellCallEndedPayload,
} from "./call-ended.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const callId = "22222222-2222-4222-8222-222222222222";
const leadId = "33333333-3333-4333-8333-333333333333";

const tenant: TenantConfig = {
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
  custom_urgency_rules: [
    {
      phrase: "vulnerable occupant without cooling",
      severity: "urgent",
      description: "AC failure with a vulnerable occupant",
    },
  ],
  created_at: "2026-05-04T12:00:00.000Z",
  updated_at: "2026-05-04T12:00:00.000Z",
};

const payload: RetellCallEndedPayload = {
  event: "call_ended",
  agent_id: "agent_prod_123",
  call_id: "retell_call_123",
  start_timestamp: Date.parse("2026-05-04T12:00:00.000Z"),
  end_timestamp: Date.parse("2026-05-04T12:04:00.000Z"),
  transcript: "Caller: My AC stopped and my elderly mother is upstairs.",
  duration_ms: 240_000,
  inbound_minutes: 4,
  outbound_transfer_minutes: 0,
};

const extraction = {
  caller_name: "Maria Garcia",
  caller_phone: "+15125550123",
  caller_email: null,
  caller_address: "Round Rock, TX",
  service_category: "AC repair",
  issue_description: "AC stopped working with elderly occupant upstairs",
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

describe("handleRetellCallEnded", () => {
  it("extracts a lead, sends email, records delivery, and updates cost telemetry", async () => {
    const storage = new FakeStorage();
    const emailClient: EmailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg_123" }),
    };

    const result = await handleRetellCallEnded(payload, {
      storage,
      geminiClient: geminiClient(JSON.stringify(extraction)),
      emailClient,
      emailFromAddress: "RequestHandoff <leads@requesthandoff.com>",
    });

    expect(result.status).toBe("delivered");
    expect(result).toMatchObject({ tenant_id: tenantId, call_id: callId, lead_id: leadId });
    expect(emailClient.send).toHaveBeenCalledTimes(1);
    expect(storage.deliveryWrites).toEqual([
      {
        tenantId,
        leadId,
        channel: "email",
        status: "delivered",
        attemptCount: 1,
        providerId: "msg_123",
        errorMessage: undefined,
      },
    ]);
    expect(storage.telemetryWrites).toHaveLength(1);
    expect(storage.telemetryWrites.at(-1)).toMatchObject({
      callId,
      geminiInputTokens: 100,
      geminiOutputTokens: 25,
      geminiCachedTokens: 80,
      resendSends: 1,
    });
  });

  it("skips email when the lead already has a delivered email receipt", async () => {
    const storage = new FakeStorage();
    storage.latestDeliveries.email = { status: "delivered", provider_id: "msg_existing" };
    const emailClient: EmailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg_new" }),
    };

    const result = await handleRetellCallEnded(payload, {
      storage,
      geminiClient: geminiClient(JSON.stringify(extraction)),
      emailClient,
      emailFromAddress: "RequestHandoff <leads@requesthandoff.com>",
    });

    expect(result.status).toBe("email_already_delivered");
    expect(emailClient.send).not.toHaveBeenCalled();
    expect(storage.deliveryWrites).toHaveLength(0);
    expect(storage.telemetryWrites).toHaveLength(1);
    expect(storage.telemetryWrites[0]).not.toHaveProperty("resendSends");
  });

  it("delivers webhook URL without blocking baseline email", async () => {
    const storage = new FakeStorage();
    storage.tenant = {
      ...tenant,
      outbound_webhook_url: "https://hooks.example.com/requesthandoff",
      outbound_webhook_secret: "test-webhook-secret-at-least-16",
    };
    const emailClient: EmailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg_123" }),
    };
    const webhookClient: WebhookHttpClient = {
      post: vi.fn().mockResolvedValue({ status: 202, text: "" }),
    };

    const result = await handleRetellCallEnded(payload, {
      storage,
      geminiClient: geminiClient(JSON.stringify(extraction)),
      emailClient,
      webhookClient,
      emailFromAddress: "RequestHandoff <leads@requesthandoff.com>",
    });

    expect(result.status).toBe("delivered");
    if (!("deliveries" in result)) throw new Error("expected delivery result");
    expect(result.deliveries.map((delivery) => delivery.channel)).toEqual(["email", "webhook_url"]);
    expect(webhookClient.post).toHaveBeenCalledTimes(1);
    expect(storage.deliveryWrites).toEqual([
      expect.objectContaining({ channel: "email", status: "delivered", providerId: "msg_123" }),
      expect.objectContaining({
        channel: "webhook_url",
        status: "delivered",
        providerId: "http_202",
      }),
    ]);
  });

  it("records webhook failure without undoing email delivery", async () => {
    const storage = new FakeStorage();
    storage.tenant = {
      ...tenant,
      outbound_webhook_url: "https://hooks.example.com/requesthandoff",
      outbound_webhook_secret: "test-webhook-secret-at-least-16",
    };
    const emailClient: EmailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg_123" }),
    };
    const webhookClient: WebhookHttpClient = {
      post: vi.fn().mockResolvedValue({ status: 400, text: "bad mapping" }),
    };

    const result = await handleRetellCallEnded(payload, {
      storage,
      geminiClient: geminiClient(JSON.stringify(extraction)),
      emailClient,
      webhookClient,
      emailFromAddress: "RequestHandoff <leads@requesthandoff.com>",
    });

    expect(result.status).toBe("delivery_failed");
    if (!("deliveries" in result)) throw new Error("expected delivery result");
    expect(result.deliveries).toEqual([
      expect.objectContaining({ channel: "email", status: "delivered" }),
      expect.objectContaining({
        channel: "webhook_url",
        status: "failed",
        error_message: expect.stringContaining("HTTP 400"),
      }),
    ]);
    expect(storage.deliveryWrites).toEqual([
      expect.objectContaining({ channel: "email", status: "delivered" }),
      expect.objectContaining({
        channel: "webhook_url",
        status: "failed",
        errorMessage: expect.stringContaining("HTTP 400"),
      }),
    ]);
  });

  it("routes repeated invalid extraction to manual review without sending email", async () => {
    const storage = new FakeStorage();
    const emailClient: EmailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg_123" }),
    };

    const result = await handleRetellCallEnded(payload, {
      storage,
      geminiClient: geminiClient(JSON.stringify({ ...extraction, urgency_level: "wat" })),
      emailClient,
      emailFromAddress: "RequestHandoff <leads@requesthandoff.com>",
    });

    expect(result.status).toBe("manual_review");
    expect(emailClient.send).not.toHaveBeenCalled();
    expect(storage.deliveryWrites).toHaveLength(0);
    expect(storage.telemetryWrites).toHaveLength(1);
    expect(storage.telemetryWrites[0]).toMatchObject({ callId });
    expect(storage.telemetryWrites[0]).not.toHaveProperty("resendSends");
  });

  it("rejects unknown agents before touching tenant data", async () => {
    const storage = new FakeStorage();
    storage.mapping = null;

    const result = await handleRetellCallEnded(payload, {
      storage,
      geminiClient: geminiClient(JSON.stringify(extraction)),
      emailClient: { send: vi.fn() },
      emailFromAddress: "RequestHandoff <leads@requesthandoff.com>",
    });

    expect(result).toEqual({ status: "unknown_agent", retell_agent_id: payload.agent_id });
    expect(storage.upsertedCalls).toHaveLength(0);
  });
});

function geminiClient(text: string): GeminiClient {
  return {
    generate: vi.fn().mockResolvedValue({
      text,
      inputTokens: 100,
      outputTokens: 25,
      cachedTokens: 80,
    }),
  };
}

class FakeStorage implements PostCallStorage {
  tenant: TenantConfig = tenant;
  mapping: { tenant_id: string; agent_kind: "production" | "demo" } | null = {
    tenant_id: tenantId,
    agent_kind: "production",
  };
  latestDeliveries: Partial<
    Record<DeliveryChannel, { status: DeliveryStatus; provider_id: string | null }>
  > = {};
  upsertedCalls: Array<Parameters<PostCallStorage["upsertCompletedCall"]>[0]> = [];
  telemetryWrites: Array<Parameters<PostCallStorage["updateCallCostTelemetry"]>[0]> = [];
  deliveryWrites: Array<Parameters<PostCallStorage["recordDelivery"]>[0]> = [];

  async resolveTenantFromAgent() {
    return this.mapping;
  }

  async loadTenantConfig() {
    return this.tenant;
  }

  async upsertCompletedCall(
    args: Parameters<PostCallStorage["upsertCompletedCall"]>[0],
  ): Promise<CallRecord> {
    this.upsertedCalls.push(args);
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
    };
  }

  async updateCallCostTelemetry(args: Parameters<PostCallStorage["updateCallCostTelemetry"]>[0]) {
    this.telemetryWrites.push(args);
  }

  async upsertLeadForCall(
    args: Parameters<PostCallStorage["upsertLeadForCall"]>[0],
  ): Promise<LeadRecord> {
    return {
      id: leadId,
      tenant_id: args.tenantId,
      call_id: args.callId,
      ...args.extraction,
      status: "new",
      attributed_value_usd: null,
      created_at: "2026-05-04T12:05:00.000Z",
      updated_at: "2026-05-04T12:05:00.000Z",
    };
  }

  async findLatestDelivery(args: { channel: DeliveryChannel }) {
    return this.latestDeliveries[args.channel] ?? null;
  }

  async recordDelivery(args: Parameters<PostCallStorage["recordDelivery"]>[0]) {
    this.deliveryWrites.push(args);
  }
}
