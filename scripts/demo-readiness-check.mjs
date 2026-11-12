#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";

const DEFAULTS = {
  dashboardUrls: ["https://requesthandoff.com", "https://www.requesthandoff.com"],
  voiceUrl: process.env.VOICE_URL || "https://voice.example.com",
  postCallUrl: process.env.POST_CALL_URL || "https://post-call.example.com",
  fallbackAgentId: process.env.RETELL_DEMO_AGENT_ID || "agent_placeholder",
  tenantId: process.env.DEMO_TENANT_ID || "00000000-0000-0000-0000-000000000000",
};

const REQUIRED_RETELL_EVENTS = new Set(["call_started", "call_analyzed", "call_ended"]);

main().catch((error) => {
  console.error(`\nReadiness check failed: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = {
    ...loadEnvFile(".supabase-hosted-runtime.env"),
    ...loadEnvFile(".vercel-production-runtime.env"),
    ...loadEnvFile("services/post-call/.env", "POST_CALL_"),
    ...loadEnvFile("services/voice/.env", "VOICE_"),
  };

  const agentId = env.RETELL_DEMO_AGENT_ID || DEFAULTS.fallbackAgentId;
  const directCallId = `readiness_direct_${Date.now()}`;
  const voiceCallId = `readiness_voice_${Date.now()}`;
  const results = [];

  results.push(await checkUrl("dashboard apex", DEFAULTS.dashboardUrls[0]));
  results.push(await checkUrl("dashboard www", DEFAULTS.dashboardUrls[1]));
  results.push(await checkJson("voice health", `${DEFAULTS.voiceUrl}/health`, { status: 200 }));
  results.push(await checkJson("post-call health", `${DEFAULTS.postCallUrl}/health`, { status: 200 }));

  if (!args.skipRetellConfig) {
    results.push(await checkRetellAgentConfig(env, agentId));
  }

  if (!args.skipSyntheticCalls) {
    results.push(await postDirectCallEnded(env, directCallId, agentId));
    results.push(await postVoiceWebhook(env, voiceCallId, agentId));
    results.push(await confirmLeadDelivery(env, voiceCallId));
  }

  printSummary(results);
}

function parseArgs(argv) {
  return {
    skipSyntheticCalls: argv.includes("--skip-synthetic-calls"),
    skipRetellConfig: argv.includes("--skip-retell-config"),
  };
}

function loadEnvFile(path, prefix = "") {
  if (!fs.existsSync(path)) return {};
  const out = {};
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = `${prefix}${line.slice(0, index).trim()}`;
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function checkUrl(name, url) {
  const started = Date.now();
  const response = await fetch(url, { redirect: "manual" });
  const ok =
    response.status >= 200 &&
    response.status < 400 &&
    response.headers.get("content-type")?.includes("text/html");
  return result(name, ok, `${response.status} in ${Date.now() - started}ms`);
}

async function checkJson(name, url, { status }) {
  const started = Date.now();
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  return result(
    name,
    response.status === status,
    `${response.status} in ${Date.now() - started}ms ${JSON.stringify(body)}`,
  );
}

async function checkRetellAgentConfig(env, agentId) {
  const apiKey = required(env.RETELL_API_KEY, "RETELL_API_KEY");
  const response = await fetch(`https://api.retellai.com/get-agent/${agentId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return result("Retell demo agent config", false, `Retell returned ${response.status}`);
  }

  const events = new Set(Array.isArray(body.webhook_events) ? body.webhook_events : []);
  const missingEvents = [...REQUIRED_RETELL_EVENTS].filter((event) => !events.has(event));
  const webhookUrl = String(body.webhook_url ?? "");
  const ok =
    webhookUrl === `${DEFAULTS.voiceUrl}/retell/webhook` &&
    missingEvents.length === 0 &&
    Number(body.webhook_timeout_ms ?? 0) >= 10_000;

  const detail = ok
    ? `webhook configured with ${[...events].join(", ")}`
    : `webhook=${webhookUrl || "missing"} missing_events=${missingEvents.join(",") || "none"}`;
  return result("Retell demo agent config", ok, detail);
}

async function postDirectCallEnded(env, callId, agentId) {
  const secret = required(env.POST_CALL_POST_CALL_WEBHOOK_SECRET, "POST_CALL_WEBHOOK_SECRET");
  const payload = buildCallEndedPayload(callId, agentId, "Sarah Miller", "AC repair", "78664");
  const response = await fetch(`${DEFAULTS.postCallUrl}/calls/ended`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-requesthandoff-worker-secret": secret,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  const ok =
    response.status === 200 &&
    body.status === "delivered" &&
    body.extraction_status === "ok" &&
    Array.isArray(body.deliveries) &&
    body.deliveries.some((delivery) => delivery.channel === "email" && delivery.status === "delivered");
  return result("direct post-call synthetic delivery", ok, summarizePipelineBody(response.status, body));
}

async function postVoiceWebhook(env, callId, agentId) {
  const secret = required(env.VOICE_RETELL_WEBHOOK_SECRET, "RETELL_WEBHOOK_SECRET");
  const body = JSON.stringify({
    event: "call_ended",
    call: buildCallEndedPayload(callId, agentId, "Mark Johnson", "water heater leak", "78681"),
  });
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const response = await fetch(`${DEFAULTS.voiceUrl}/retell/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-retell-signature": signature,
    },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  const ok = response.status === 200 && payload.ok === true && payload.post_call_triggered === true;
  return result("voice webhook to post-call synthetic delivery", ok, JSON.stringify(payload));
}

async function confirmLeadDelivery(env, retellCallId) {
  const supabaseUrl = required(env.SUPABASE_URL, "SUPABASE_URL");
  const serviceKey = required(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  const calls = await supabaseGet(
    supabaseUrl,
    headers,
    `calls?select=id,tenant_id,retell_call_id,status,direction,duration_seconds&retell_call_id=eq.${encodeURIComponent(retellCallId)}&limit=1`,
  );
  const call = calls[0];
  if (!call) return result("Supabase call/lead/delivery confirmation", false, "call row missing");

  const leads = await supabaseGet(
    supabaseUrl,
    headers,
    `leads?select=id,status,caller_name,service_category,urgency_level,preferred_window,call_confidence_score&call_id=eq.${call.id}&limit=1`,
  );
  const lead = leads[0];
  if (!lead) return result("Supabase call/lead/delivery confirmation", false, "lead row missing");

  const deliveries = await supabaseGet(
    supabaseUrl,
    headers,
    `deliveries?select=channel,status,attempt_count,provider_id&lead_id=eq.${lead.id}&order=created_at.desc&limit=3`,
  );
  const emailDelivery = deliveries.find((delivery) => delivery.channel === "email");
  const ok =
    call.tenant_id === DEFAULTS.tenantId &&
    call.status === "completed" &&
    call.direction === "demo" &&
    lead.status === "new" &&
    emailDelivery?.status === "delivered";
  return result(
    "Supabase call/lead/delivery confirmation",
    ok,
    `call=${call.status}/${call.direction} lead=${lead.service_category}/${lead.urgency_level} email=${emailDelivery?.status ?? "missing"}`,
  );
}

async function supabaseGet(baseUrl, headers, path) {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, { headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase query failed with ${response.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}

function buildCallEndedPayload(callId, agentId, callerName, service, zip) {
  const now = Date.now();
  return {
    event: "call_ended",
    agent_id: agentId,
    call_id: callId,
    start_timestamp: now - 240_000,
    end_timestamp: now,
    duration_ms: 240_000,
    inbound_minutes: 4,
    outbound_transfer_minutes: 0,
    transcript: [
      "Agent: Thank you for calling. For quality, this call may be recorded. How can I help?",
      `Caller: This is ${callerName}. I need help with ${service} at my house in Austin, zip ${zip}.`,
      "Agent: Is there active danger or damage happening right now?",
      "Caller: No immediate danger, but I would like a callback today and an appointment tomorrow morning if possible.",
      "Agent: What is the best callback number?",
      "Caller: 512-555-0184. You can email me at demo@example.com.",
      "Agent: I will send a structured handoff with your service request, location, urgency, and preferred window.",
    ].join("\n"),
  };
}

function required(value, name) {
  if (!value) throw new Error(`${name} is required for hosted readiness checks`);
  return value;
}

function summarizePipelineBody(status, body) {
  const deliveries = Array.isArray(body.deliveries)
    ? body.deliveries.map((delivery) => `${delivery.channel}:${delivery.status}`).join(",")
    : "none";
  return `status=${status} pipeline=${body.status ?? "unknown"} extraction=${body.extraction_status ?? "unknown"} deliveries=${deliveries}`;
}

function result(name, ok, detail) {
  return { name, ok, detail };
}

function printSummary(results) {
  console.log("\nRequestHandoff demo readiness");
  console.log("================================");
  for (const item of results) {
    console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}: ${item.detail}`);
  }

  const failed = results.filter((item) => !item.ok);
  if (failed.length > 0) {
    console.log(`\nNO-GO: ${failed.length} readiness check(s) failed.`);
    process.exitCode = 1;
    return;
  }
  console.log("\nGO for founder-led demo rehearsal. Do not enable production call forwarding without the live-pilot runbook gates.");
}
