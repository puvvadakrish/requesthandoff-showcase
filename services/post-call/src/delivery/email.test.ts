import type { LeadRecord, TenantConfig } from "@requesthandoff/schema";
import { describe, expect, it, vi } from "vitest";

import { deliverLeadEmail, type EmailClient } from "./email.js";

const tenant: TenantConfig = {
  id: "tenant-1",
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
  services_offered: [],
  services_not_offered: [],
  coverage_zip_codes: [],
  custom_urgency_rules: [],
  created_at: "2026-05-04T12:00:00.000Z",
  updated_at: "2026-05-04T12:00:00.000Z",
};

const lead: LeadRecord = {
  id: "lead-1",
  tenant_id: tenant.id,
  call_id: "call-1",
  caller_name: "Maria Garcia",
  caller_phone: "+15125550123",
  caller_email: null,
  caller_address: "Round Rock, TX",
  service_category: "AC repair",
  issue_description: "AC stopped working; vulnerable occupant upstairs",
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
  created_at: "2026-05-04T12:00:00.000Z",
  updated_at: "2026-05-04T12:00:00.000Z",
};

describe("deliverLeadEmail", () => {
  it("delivers on first attempt when send succeeds", async () => {
    const client: EmailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg_abc" }),
    };
    const r = await deliverLeadEmail({
      client,
      tenant,
      lead,
      fromAddress: "noreply@requesthandoff.com",
    });
    expect(r.status).toBe("delivered");
    expect(r.attempts).toBe(1);
    expect(r.provider_id).toBe("msg_abc");
    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it("retries with backoff on send failure (cap 5)", async () => {
    const client: EmailClient = {
      send: vi
        .fn()
        .mockRejectedValueOnce(new Error("503 Service Unavailable"))
        .mockRejectedValueOnce(new Error("503 Service Unavailable"))
        .mockResolvedValueOnce({ id: "msg_after_retry" }),
    };
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const r = await deliverLeadEmail({
      client,
      tenant,
      lead,
      fromAddress: "noreply@requesthandoff.com",
      sleepFn,
    });
    expect(r.status).toBe("delivered");
    expect(r.attempts).toBe(3);
    expect(client.send).toHaveBeenCalledTimes(3);
    expect(sleepFn).toHaveBeenCalledTimes(2); // backoff between failures
  });

  it("returns failed after exhausting all attempts", async () => {
    const client: EmailClient = {
      send: vi.fn().mockRejectedValue(new Error("permanent failure")),
    };
    const r = await deliverLeadEmail({
      client,
      tenant,
      lead,
      fromAddress: "noreply@requesthandoff.com",
      sleepFn: async () => {},
      maxAttempts: 3,
    });
    expect(r.status).toBe("failed");
    expect(r.attempts).toBe(3);
    expect(r.error).toBe("permanent failure");
  });

  it("URGENT subject prefix when urgency_level=urgent", async () => {
    const client: EmailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg_x" }),
    };
    await deliverLeadEmail({
      client,
      tenant,
      lead,
      fromAddress: "noreply@requesthandoff.com",
    });
    const sentArg = (client.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sentArg.subject).toMatch(/^\[URGENT\]/);
  });

  it("includes tenant_id + lead_id headers for downstream verification", async () => {
    const client: EmailClient = {
      send: vi.fn().mockResolvedValue({ id: "msg_x" }),
    };
    await deliverLeadEmail({
      client,
      tenant,
      lead,
      fromAddress: "noreply@requesthandoff.com",
    });
    const sentArg = (client.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sentArg.headers["X-RequestHandoff-Lead-Id"]).toBe(lead.id);
    expect(sentArg.headers["X-RequestHandoff-Tenant-Id"]).toBe(tenant.id);
    expect(sentArg.headers["X-RequestHandoff-Urgency"]).toBe("urgent");
  });
});
