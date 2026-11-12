import { createHmac } from "node:crypto";

import type { LeadRecord, TenantConfig } from "@requesthandoff/schema";
import { describe, expect, it, vi } from "vitest";

import { assertSafeWebhookUrl, deliverLeadWebhook, type WebhookHttpClient } from "./webhook-url.js";

const tenant: TenantConfig = {
  id: "11111111-1111-4111-8111-111111111111",
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
  outbound_webhook_url: "https://hooks.example.com/requesthandoff",
  outbound_webhook_secret: "test-webhook-secret-at-least-16",
  custom_urgency_rules: [],
  created_at: "2026-05-04T12:00:00.000Z",
  updated_at: "2026-05-04T12:00:00.000Z",
};

const lead: LeadRecord = {
  id: "33333333-3333-4333-8333-333333333333",
  tenant_id: tenant.id,
  call_id: "22222222-2222-4222-8222-222222222222",
  caller_name: "Maria Garcia",
  caller_phone: "+15125550123",
  caller_email: null,
  caller_address: "Round Rock, TX",
  service_category: "AC repair",
  issue_description: "AC stopped cooling with elderly occupant upstairs",
  location: "78664",
  urgency_level: "urgent",
  urgency_confidence: 0.95,
  preferred_window: null,
  recommended_action: "warm_transfer_to_owner",
  recommended_action_confidence: 0.9,
  missing_information: ["caller_email"],
  call_confidence_score: 0.92,
  rule_match_known: true,
  status: "new",
  attributed_value_usd: null,
  created_at: "2026-05-04T12:05:00.000Z",
  updated_at: "2026-05-04T12:05:00.000Z",
};

describe("deliverLeadWebhook", () => {
  it("posts structured lead JSON with RequestHandoff metadata and HMAC signature", async () => {
    const client: WebhookHttpClient = {
      post: vi.fn().mockResolvedValue({ status: 204, text: "" }),
    };

    const result = await deliverLeadWebhook({ client, tenant, lead });

    expect(result).toEqual({ status: "delivered", attempts: 1, provider_id: "http_204" });
    const arg = (client.post as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBe(tenant.outbound_webhook_url);
    expect(JSON.parse(arg.body)).toMatchObject({
      event: "lead.captured",
      tenant: { id: tenant.id, business_name: tenant.business_name },
      lead: { id: lead.id, urgency_level: "urgent", service_category: "AC repair" },
    });
    expect(arg.headers["X-RequestHandoff-Lead-Id"]).toBe(lead.id);
    expect(arg.headers["X-RequestHandoff-Signature"]).toBe(
      `sha256=${createHmac("sha256", tenant.outbound_webhook_secret!).update(arg.body).digest("hex")}`,
    );
  });

  it("retries 5xx responses with backoff", async () => {
    const client: WebhookHttpClient = {
      post: vi
        .fn()
        .mockResolvedValueOnce({ status: 503, text: "try later" })
        .mockResolvedValueOnce({ status: 200 }),
    };
    const sleepFn = vi.fn().mockResolvedValue(undefined);

    const result = await deliverLeadWebhook({ client, tenant, lead, sleepFn });

    expect(result.status).toBe("delivered");
    expect(result.attempts).toBe(2);
    expect(client.post).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenCalledTimes(1);
  });

  it("does not retry 4xx responses", async () => {
    const client: WebhookHttpClient = {
      post: vi.fn().mockResolvedValue({ status: 400, text: "bad mapping" }),
    };

    const result = await deliverLeadWebhook({ client, tenant, lead });

    expect(result.status).toBe("failed");
    expect(result.attempts).toBe(1);
    expect(result.error).toContain("HTTP 400");
    expect(client.post).toHaveBeenCalledTimes(1);
  });

  it("fails with zero attempts when tenant has no webhook URL", async () => {
    const client: WebhookHttpClient = {
      post: vi.fn(),
    };

    const result = await deliverLeadWebhook({
      client,
      tenant: { ...tenant, outbound_webhook_url: null },
      lead,
    });

    expect(result.status).toBe("failed");
    expect(result.attempts).toBe(0);
    expect(client.post).not.toHaveBeenCalled();
  });

  it("records unsafe webhook URLs as failed delivery before making a request", async () => {
    const client: WebhookHttpClient = {
      post: vi.fn(),
    };

    const result = await deliverLeadWebhook({
      client,
      tenant: { ...tenant, outbound_webhook_url: "https://127.0.0.1/hook" },
      lead,
    });

    expect(result.status).toBe("failed");
    expect(result.attempts).toBe(0);
    expect(result.error).toContain("private, loopback, or link-local");
    expect(client.post).not.toHaveBeenCalled();
  });
});

describe("assertSafeWebhookUrl", () => {
  it.each([
    "http://hooks.example.com/requesthandoff",
    "https://localhost/requesthandoff",
    "https://192.168.1.10/requesthandoff",
    "https://10.0.0.10/requesthandoff",
    "https://169.254.169.254/latest/meta-data",
    "https://[::1]/requesthandoff",
  ])("rejects unsafe URL %s", (url) => {
    expect(() => assertSafeWebhookUrl(url)).toThrow();
  });

  it("allows normal HTTPS public hostnames", () => {
    expect(() => assertSafeWebhookUrl("https://hooks.example.com/requesthandoff")).not.toThrow();
  });
});
