import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TenantConfigCache } from "../cache/tenant-config.js";
import { buildRetellWebhookRouter, verifyRetellSignature, type PostCallForwarder } from "./retell.js";

describe("verifyRetellSignature", () => {
  const secret = "test-secret-do-not-use-in-prod";
  const payload = JSON.stringify({ event: "call_started", agent_id: "agent_x", call_id: "call_y" });
  const validSignature = createHmac("sha256", secret).update(payload).digest("hex");

  it("accepts a correctly-signed payload", () => {
    expect(verifyRetellSignature(payload, validSignature, secret)).toBe(true);
  });

  it("accepts a sha256= prefixed signature", () => {
    expect(verifyRetellSignature(payload, `sha256=${validSignature}`, secret)).toBe(true);
  });

  it("rejects a tampered payload (signature does not match)", () => {
    const tampered = JSON.stringify({ event: "call_started", agent_id: "agent_OTHER", call_id: "call_y" });
    expect(verifyRetellSignature(tampered, validSignature, secret)).toBe(false);
  });

  it("rejects a bad signature for the right payload", () => {
    expect(verifyRetellSignature(payload, "0".repeat(64), secret)).toBe(false);
  });

  it("rejects when the secret is wrong", () => {
    expect(verifyRetellSignature(payload, validSignature, "different-secret")).toBe(false);
  });

  it("rejects empty signature", () => {
    expect(verifyRetellSignature(payload, "", secret)).toBe(false);
  });

  it("rejects empty secret", () => {
    expect(verifyRetellSignature(payload, validSignature, "")).toBe(false);
  });

  it("rejects mismatched length signatures (constant-time guard)", () => {
    expect(verifyRetellSignature(payload, "abcd", secret)).toBe(false);
  });
});

describe("buildRetellWebhookRouter call_ended forwarding", () => {
  const secret = "test-secret-do-not-use-in-prod";
  const payload = {
    event: "call_ended",
    agent_id: "agent_prod_123",
    call_id: "retell_call_123",
    start_timestamp: Date.parse("2026-05-04T12:00:00.000Z"),
    end_timestamp: Date.parse("2026-05-04T12:04:00.000Z"),
    transcript: "Caller: my AC stopped",
    duration_ms: 240_000,
    inbound_minutes: 4,
    outbound_transfer_minutes: 0,
  };

  beforeEach(() => {
    process.env["RETELL_WEBHOOK_SECRET"] = secret;
    delete process.env["POST_CALL_WORKER_URL"];
    delete process.env["POST_CALL_WEBHOOK_SECRET"];
  });

  afterEach(() => {
    delete process.env["RETELL_WEBHOOK_SECRET"];
    delete process.env["POST_CALL_WORKER_URL"];
    delete process.env["POST_CALL_WEBHOOK_SECRET"];
    vi.unstubAllGlobals();
  });

  it("updates the call and forwards the signed call_ended payload to post-call", async () => {
    const supabase = fakeSupabase();
    const postCallForwarder: PostCallForwarder = {
      forwardCallEnded: vi.fn().mockResolvedValue(undefined),
    };
    const app = buildRetellWebhookRouter(fakeCache(), {
      supabase: supabase.client,
      postCallForwarder,
    });

    const response = await app.request("/webhook", signedRequest(payload));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, post_call_triggered: true });
    expect(supabase.updatePayload).toMatchObject({
      status: "completed",
      transcript: payload.transcript,
      duration_seconds: 240,
      retell_inbound_minutes: 4,
    });
    expect(supabase.filters).toEqual([
      ["retell_call_id", payload.call_id],
      ["tenant_id", "11111111-1111-4111-8111-111111111111"],
    ]);
    expect(postCallForwarder.forwardCallEnded).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "call_ended",
        agent_id: payload.agent_id,
        call_id: payload.call_id,
        start_timestamp: payload.start_timestamp,
        end_timestamp: payload.end_timestamp,
        transcript: payload.transcript,
      }),
    );
  });

  it("normalizes Retell's nested call_ended payload before updating and forwarding", async () => {
    const supabase = fakeSupabase();
    const postCallForwarder: PostCallForwarder = {
      forwardCallEnded: vi.fn().mockResolvedValue(undefined),
    };
    const app = buildRetellWebhookRouter(fakeCache(), {
      supabase: supabase.client,
      postCallForwarder,
    });

    const response = await app.request(
      "/webhook",
      signedRequest({
        event: "call_ended",
        call: {
          event: "call_ended",
          agent_id: payload.agent_id,
          call_id: payload.call_id,
          start_timestamp: payload.start_timestamp,
          end_timestamp: payload.end_timestamp,
          transcript: payload.transcript,
          inbound_minutes: payload.inbound_minutes,
          outbound_transfer_minutes: payload.outbound_transfer_minutes,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(supabase.updatePayload).toMatchObject({
      status: "completed",
      transcript: payload.transcript,
      duration_seconds: 240,
    });
    expect(postCallForwarder.forwardCallEnded).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "call_ended",
        agent_id: payload.agent_id,
        call_id: payload.call_id,
        start_timestamp: payload.start_timestamp,
        end_timestamp: payload.end_timestamp,
        transcript: payload.transcript,
      }),
    );
  });

  it("acknowledges nested call_analyzed payloads to avoid Retell default-event retries", async () => {
    const app = buildRetellWebhookRouter(fakeCache(), {
      supabase: fakeSupabase().client,
      postCallForwarder: null,
    });

    const response = await app.request(
      "/webhook",
      signedRequest({
        event: "call_analyzed",
        call: {
          agent_id: "agent_prod_123",
          call_id: "retell_call_123",
          call_analysis: { call_summary: "Caller needed AC repair." },
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("normalizes Retell's nested call_started payload and inserts by resolved tenant", async () => {
    const supabase = fakeSupabase();
    const app = buildRetellWebhookRouter(fakeCache(), {
      supabase: supabase.client,
      postCallForwarder: null,
    });

    const response = await app.request(
      "/webhook",
      signedRequest({
        event: "call_started",
        call: {
          agent_id: "agent_prod_123",
          call_id: "retell_call_123",
          start_timestamp: Date.parse("2026-05-04T12:00:00.000Z"),
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(supabase.insertPayload).toMatchObject({
      tenant_id: "11111111-1111-4111-8111-111111111111",
      retell_agent_id: "agent_prod_123",
      retell_call_id: "retell_call_123",
      direction: "inbound",
      status: "in_progress",
      started_at: "2026-05-04T12:00:00.000Z",
    });
  });

  it("rejects nested payloads without a Retell agent id before tenant resolution", async () => {
    const cache = fakeCache();
    const app = buildRetellWebhookRouter(cache, {
      supabase: fakeSupabase().client,
      postCallForwarder: null,
    });

    const response = await app.request(
      "/webhook",
      signedRequest({
        event: "call_started",
        call: {
          call_id: "retell_call_123",
          start_timestamp: Date.parse("2026-05-04T12:00:00.000Z"),
        },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "bad_payload" });
    expect(cache.resolveAgentMock).not.toHaveBeenCalled();
  });

  it("rejects lifecycle payloads with missing timestamps instead of fabricating call times", async () => {
    const cache = fakeCache();
    const app = buildRetellWebhookRouter(cache, {
      supabase: fakeSupabase().client,
      postCallForwarder: null,
    });

    const response = await app.request(
      "/webhook",
      signedRequest({
        event: "call_ended",
        call: {
          agent_id: "agent_prod_123",
          call_id: "retell_call_123",
          end_timestamp: Date.parse("2026-05-04T12:04:00.000Z"),
        },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "bad_payload" });
    expect(cache.resolveAgentMock).not.toHaveBeenCalled();
  });

  it("returns 502 when post-call forwarding fails so Retell can retry safely", async () => {
    const app = buildRetellWebhookRouter(fakeCache(), {
      supabase: fakeSupabase().client,
      postCallForwarder: {
        forwardCallEnded: vi.fn().mockRejectedValue(new Error("post-call down")),
      },
    });

    const response = await app.request("/webhook", signedRequest(payload));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "post_call_failed" });
  });

  it("returns 500 when no post-call worker is configured", async () => {
    const app = buildRetellWebhookRouter(fakeCache(), {
      supabase: fakeSupabase().client,
    });

    const response = await app.request("/webhook", signedRequest(payload));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "post_call_misconfigured" });
  });

  it("uses a timeout and does not follow redirects when forwarding from env", async () => {
    process.env["POST_CALL_WORKER_URL"] = "https://post-call.example.test/";
    process.env["POST_CALL_WEBHOOK_SECRET"] = "worker-secret";
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const app = buildRetellWebhookRouter(fakeCache(), {
      supabase: fakeSupabase().client,
    });

    const response = await app.request("/webhook", signedRequest(payload));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://post-call.example.test/calls/ended",
      expect.objectContaining({
        method: "POST",
        redirect: "manual",
        signal: expect.any(AbortSignal),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-requesthandoff-worker-secret": "worker-secret",
        }),
      }),
    );
  });
});

function signedRequest(payload: object): RequestInit {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", "test-secret-do-not-use-in-prod").update(body).digest("hex");
  return {
    method: "POST",
    headers: { "x-retell-signature": signature },
    body,
  };
}

function fakeCache(): TenantConfigCache & {
  resolveAgentMock: ReturnType<typeof vi.fn>;
} {
  const resolveAgent = vi.fn().mockResolvedValue({
      tenant_id: "11111111-1111-4111-8111-111111111111",
      agent_kind: "production",
    });
  const cache = new TenantConfigCache({
    loadTenantById: vi.fn(),
    loadScaffoldChain: vi.fn(),
    resolveAgent,
  });
  return Object.assign(cache, { resolveAgentMock: resolveAgent });
}

function fakeSupabase() {
  const state: {
    insertPayload?: Record<string, unknown>;
    updatePayload?: Record<string, unknown>;
    filters: Array<[string, unknown]>;
  } = {
    filters: [],
  };

  const chain = {
    insert(payload: Record<string, unknown>) {
      state.insertPayload = payload;
      return chain;
    },
    update(payload: Record<string, unknown>) {
      state.updatePayload = payload;
      return chain;
    },
    eq(column: string, value: unknown) {
      state.filters.push([column, value]);
      return chain;
    },
    then(resolve: (value: { error: null }) => void) {
      resolve({ error: null });
    },
    select() {
      return chain;
    },
    maybeSingle() {
      return { error: null };
    },
  };

  return {
    get insertPayload() {
      return state.insertPayload;
    },
    get updatePayload() {
      return state.updatePayload;
    },
    get filters() {
      return state.filters;
    },
    client: {
      from: vi.fn().mockReturnValue(chain),
    } as never,
  };
}
