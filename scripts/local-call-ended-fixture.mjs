import { createHmac } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:net";

import { serve } from "../services/post-call/node_modules/@hono/node-server/dist/index.mjs";

import { buildPostCallApp } from "../services/post-call/dist/app.js";
import { SupabasePostCallStorage } from "../services/post-call/dist/storage/supabase.js";
import { buildRetellWebhookRouter } from "../services/voice/dist/runtime/retell.js";
import { createServiceSupabase } from "../packages/supabase-client-service/dist/index.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const callId = "22222222-2222-4222-8222-222222222222";
const leadId = "33333333-3333-4333-8333-333333333333";
const retellSecret = "local-retell-secret";
const postCallSecret = "local-post-call-secret";
const mode = process.argv.includes("--supabase") ? "supabase" : "memory";
const keepRows = process.argv.includes("--keep");

const payload = {
  event: "call_ended",
  agent_id: "agent_prod_local",
  call_id: "retell_call_local_001",
  start_timestamp: Date.parse("2026-06-02T14:00:00.000Z"),
  end_timestamp: Date.parse("2026-06-02T14:03:12.000Z"),
  transcript:
    "Agent: Thanks for calling Austin HVAC Co. Caller: My AC stopped cooling and my elderly father is upstairs. Agent: What is your name and phone number? Caller: Maria Garcia, +15125550123. We are in Round Rock, 78664.",
  duration_ms: 192_000,
  inbound_minutes: 3.2,
  outbound_transfer_minutes: 0,
};

const tenant = {
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
      phrase: "no cooling vulnerable occupant",
      severity: "urgent",
      description: "AC failure with vulnerable occupant",
    },
  ],
  created_at: "2026-06-02T14:00:00.000Z",
  updated_at: "2026-06-02T14:00:00.000Z",
};

class FixturePostCallStorage {
  calls = [];
  leads = [];
  deliveries = [];
  telemetryWrites = [];

  async resolveTenantFromAgent() {
    return { tenant_id: tenantId, agent_kind: "production" };
  }

  async loadTenantConfig() {
    return tenant;
  }

  async upsertCompletedCall(args) {
    const call = {
      id: callId,
      tenant_id: args.tenantId,
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
    };
    this.calls = [call];
    return call;
  }

  async updateCallCostTelemetry(args) {
    this.telemetryWrites.push(args);
  }

  async upsertLeadForCall(args) {
    const lead = {
      id: leadId,
      tenant_id: args.tenantId,
      call_id: args.callId,
      ...args.extraction,
      status: "new",
      attributed_value_usd: null,
      created_at: "2026-06-02T14:03:15.000Z",
      updated_at: "2026-06-02T14:03:15.000Z",
    };
    this.leads = [lead];
    return lead;
  }

  async findLatestDelivery() {
    return null;
  }

  async recordDelivery(args) {
    this.deliveries.push({
      tenant_id: args.tenantId,
      lead_id: args.leadId,
      channel: args.channel,
      status: args.status,
      attempt_count: args.attemptCount,
      provider_id: args.providerId ?? null,
      error_message: args.errorMessage ?? null,
    });
  }
}

function fakeVoiceCache() {
  return {
    resolveAgent: async () => ({ tenant_id: tenantId, agent_kind: "production" }),
  };
}

function fakeVoiceSupabase() {
  const chain = {
    update() {
      return chain;
    },
    eq() {
      return chain;
    },
    then(resolve) {
      resolve({ error: null });
    },
  };

  return {
    from() {
      return chain;
    },
  };
}

async function runFixture() {
  const supabase = mode === "supabase" ? createLocalSupabaseClient() : null;
  if (supabase) {
    await cleanupSupabaseRows(supabase);
    await bootstrapSupabaseRows(supabase);
  }

  const storage = supabase ? new SupabasePostCallStorage(supabase) : new FixturePostCallStorage();
  const port = await findOpenPort();
  const postCallApp = buildPostCallApp({
    webhookSecret: postCallSecret,
    storage,
    geminiClient: {
      async generate() {
        return {
          text: JSON.stringify({
            caller_name: "Maria Garcia",
            caller_phone: "+15125550123",
            caller_email: null,
            caller_address: "Round Rock, TX",
            service_category: "AC repair",
            issue_description: "AC stopped cooling with elderly occupant upstairs",
            location: "78664",
            urgency_level: "urgent",
            urgency_confidence: 0.95,
            preferred_window: "as soon as possible",
            recommended_action: "warm_transfer_to_owner",
            recommended_action_confidence: 0.9,
            missing_information: ["caller_email"],
            call_confidence_score: 0.93,
            rule_match_known: true,
          }),
          inputTokens: 1200,
          outputTokens: 240,
          cachedTokens: 900,
        };
      },
    },
    emailClient: {
      async send() {
        return { id: "fixture_msg_001" };
      },
    },
    emailFromAddress: "RequestHandoff <leads@requesthandoff.com>",
  });

  const server = serve({ fetch: postCallApp.fetch, port });

  try {
    process.env["RETELL_WEBHOOK_SECRET"] = retellSecret;
    process.env["POST_CALL_WORKER_URL"] = `http://127.0.0.1:${port}`;
    process.env["POST_CALL_WEBHOOK_SECRET"] = postCallSecret;

    const voiceApp = buildRetellWebhookRouter(fakeVoiceCache(), {
      supabase: supabase ?? fakeVoiceSupabase(),
    });

    const body = JSON.stringify(payload);
    const response = await voiceApp.request("/webhook", {
      method: "POST",
      headers: {
        "x-retell-signature": createHmac("sha256", retellSecret).update(body).digest("hex"),
      },
      body,
    });

    const responseBody = await response.json();
    assert(
      response.status === 200,
      `expected voice webhook 200, got ${response.status}: ${JSON.stringify(responseBody)}`,
    );
    const rows = supabase ? await loadSupabaseResultRows(supabase) : loadMemoryResultRows(storage);
    assert(rows.call, "expected a post-call call row");
    assert(rows.lead, "expected a lead row");
    assert(rows.delivery, "expected a delivery row");
    assert(rows.lead.urgency_level === "urgent", "expected urgent extracted lead");
    assert(rows.delivery.status === "delivered", "expected delivered email handoff");

    console.log(
      JSON.stringify(
        {
          ok: true,
          mode,
          voice_response: responseBody,
          call: rows.call,
          lead: rows.lead,
          delivery: rows.delivery,
          telemetry: rows.telemetry,
          cleanup: supabase && keepRows ? "kept fixture rows" : "not persisted",
        },
        null,
        2,
      ),
    );
  } finally {
    delete process.env["RETELL_WEBHOOK_SECRET"];
    delete process.env["POST_CALL_WORKER_URL"];
    delete process.env["POST_CALL_WEBHOOK_SECRET"];
    server.close();
    if (supabase && !keepRows) await cleanupSupabaseRows(supabase);
  }
}

function createLocalSupabaseClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["NEXT_PUBLIC_SUPABASE_URL"];
  assert(url, "SUPABASE_URL is required for --supabase mode");
  assert(
    isLocalSupabaseUrl(url),
    `refusing to run --supabase fixture against non-local SUPABASE_URL: ${url}`,
  );
  assert(
    process.env["SUPABASE_SERVICE_ROLE_KEY"],
    "SUPABASE_SERVICE_ROLE_KEY is required for --supabase mode",
  );
  return createServiceSupabase();
}

function isLocalSupabaseUrl(value) {
  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

async function bootstrapSupabaseRows(supabase) {
  const { error: tenantError } = await supabase.from("tenants").upsert(
    {
      ...tenant,
      status: "active",
    },
    { onConflict: "id" },
  );
  if (tenantError) throw tenantError;

  const { error: agentError } = await supabase.from("agent_to_tenant").upsert(
    {
      retell_agent_id: payload.agent_id,
      tenant_id: tenantId,
      agent_kind: "production",
    },
    { onConflict: "retell_agent_id" },
  );
  if (agentError) throw agentError;
}

async function cleanupSupabaseRows(supabase) {
  const { data: calls, error: callsError } = await supabase
    .from("calls")
    .select("id")
    .eq("retell_call_id", payload.call_id);
  if (callsError) throw callsError;

  const callIds = (calls ?? []).map((call) => call.id);
  if (callIds.length > 0) {
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id")
      .in("call_id", callIds);
    if (leadsError) throw leadsError;

    const leadIds = (leads ?? []).map((lead) => lead.id);
    if (leadIds.length > 0) {
      const { error: deliveriesError } = await supabase
        .from("deliveries")
        .delete()
        .in("lead_id", leadIds);
      if (deliveriesError) throw deliveriesError;
      const { error: leadsDeleteError } = await supabase.from("leads").delete().in("id", leadIds);
      if (leadsDeleteError) throw leadsDeleteError;
    }

    const { error: callsDeleteError } = await supabase.from("calls").delete().in("id", callIds);
    if (callsDeleteError) throw callsDeleteError;
  }

  const { error: agentError } = await supabase
    .from("agent_to_tenant")
    .delete()
    .eq("retell_agent_id", payload.agent_id);
  if (agentError) throw agentError;
  const { error: tenantError } = await supabase.from("tenants").delete().eq("id", tenantId);
  if (tenantError) throw tenantError;
}

async function loadSupabaseResultRows(supabase) {
  const { data: call, error: callError } = await supabase
    .from("calls")
    .select("*")
    .eq("retell_call_id", payload.call_id)
    .single();
  if (callError) throw callError;

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("call_id", call.id)
    .single();
  if (leadError) throw leadError;

  const { data: delivery, error: deliveryError } = await supabase
    .from("deliveries")
    .select("*")
    .eq("lead_id", lead.id)
    .eq("channel", "email")
    .single();
  if (deliveryError) throw deliveryError;

  return {
    call,
    lead,
    delivery,
    telemetry: {
      gemini_input_tokens: call.gemini_input_tokens,
      gemini_output_tokens: call.gemini_output_tokens,
      gemini_cached_tokens: call.gemini_cached_tokens,
      resend_sends: call.resend_sends,
    },
  };
}

function loadMemoryResultRows(storage) {
  return {
    call: storage.calls[0],
    lead: storage.leads[0],
    delivery: storage.deliveries[0],
    telemetry: storage.telemetryWrites.at(-1),
  };
}

async function findOpenPort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object", "expected an assigned local port");
  const port = address.port;
  server.close();
  await once(server, "close");
  return port;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await runFixture();
} catch (err) {
  if (mode === "supabase") {
    console.error(
      [
        "Supabase-backed fixture failed.",
        "",
        "Expected a local Supabase instance for this repo plus its service-role key:",
        "  SUPABASE_URL=http://127.0.0.1:54321",
        "  SUPABASE_SERVICE_ROLE_KEY=<from `supabase status -o env`>",
        "",
        "If port 54321 belongs to another project, stop that project or run this repo's Supabase stack first.",
        "",
        `Original error: ${formatError(err)}`,
      ].join("\n"),
    );
  } else {
    console.error(err);
  }
  process.exitCode = 1;
}

function formatError(err) {
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
}
