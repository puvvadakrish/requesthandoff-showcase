/**
 * VoiceRuntime seam — Retell webhook receiver + lifecycle (plan U5, U8 + R29).
 *
 * Why this is a SINGLE FILE and not `packages/voice-runtime/`:
 * --------------------------------------------------------------
 * R29 promises that swapping Retell for an alternate runtime (Vapi, LiveKit
 * Agents, Gemini Live once it reaches GA with async function calling) should
 * be "a week of work, not a quarter." The way that promise is kept is by
 * keeping all product logic OUT of this file (playbook composition, urgency
 * rules, lead extraction live in services/post-call and services/voice/tools)
 * and keeping all Retell-specific code IN this file.
 *
 * A formal `packages/voice-runtime` interface with a single implementation +
 * one consumer is speculative generality. We promote to a shared package only
 * when a second runtime is within 4 weeks of evaluation (per plan D-decisions
 * + scope-guardian SG-01). Until then, the seam is a documented comment block
 * + a discipline rule (no Retell SDK imports outside this file, enforced via
 * ESLint `no-restricted-imports` — round 3 F2).
 *
 * The 3-method contract a future runtime swap must satisfy:
 * --------------------------------------------------------------
 *   1. startCall(tenantConfig)
 *        Provision a runtime-specific agent + DID using the assembled playbook
 *        (greeting + urgency rules + qualification fields + tool definitions).
 *        Return a runtime-specific agent identifier we map to tenant_id in
 *        agent_to_tenant.
 *
 *   2. onTranscript(callId, transcriptDelta)
 *        Receive partial / final transcripts during/after a call. We persist
 *        the final transcript to calls.transcript and trigger the post-call
 *        worker via call_ended.
 *
 *   3. executeTool(callId, toolName, args)
 *        Dispatch a mid-call function-call request from the runtime to the
 *        appropriate handler in services/voice/src/tools/. Must respond <150ms
 *        p99 (R8, AE5).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { Hono } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabase } from "@requesthandoff/supabase-client-service";

import type { TenantConfigCache } from "../cache/tenant-config.js";
import { logger } from "../observability/logger.js";

const RETELL_SIGNATURE_HEADER = "x-retell-signature";
const POST_CALL_SECRET_HEADER = "x-requesthandoff-worker-secret";
const POST_CALL_FORWARD_TIMEOUT_MS = 20_000;

/**
 * Verify Retell's HMAC signature on the webhook payload.
 * Retell signs with HMAC-SHA256(payload) using the webhook secret.
 *
 * Constant-time comparison via Node's timingSafeEqual.
 */
export function verifyRetellSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signature.toLowerCase().replace(/^sha256=/, "");
  if (computed.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(provided));
}

interface RetellWebhookPayloadBase {
  event: string;
  agent_id: string;
  call_id: string;
}

interface RetellCallStartedPayload extends RetellWebhookPayloadBase {
  event: "call_started";
  start_timestamp: number;
}

interface RetellCallEndedPayload extends RetellWebhookPayloadBase {
  event: "call_ended";
  start_timestamp: number;
  end_timestamp: number;
  transcript?: string;
  duration_ms?: number;
  inbound_minutes?: number;
  outbound_transfer_minutes?: number;
}

interface RetellFunctionCallPayload extends RetellWebhookPayloadBase {
  event: "function_call";
  function_name: string;
  arguments: Record<string, unknown>;
}

interface RetellCallAnalyzedPayload extends RetellWebhookPayloadBase {
  event: "call_analyzed";
}

type RetellWebhookPayload =
  | RetellCallStartedPayload
  | RetellCallEndedPayload
  | RetellFunctionCallPayload
  | RetellCallAnalyzedPayload;

type RetellWebhookEnvelope = Record<string, unknown> & {
  event?: unknown;
  call?: Record<string, unknown>;
};

export interface PostCallForwarder {
  forwardCallEnded(payload: RetellCallEndedPayload): Promise<void>;
}

export interface RetellWebhookRouterOptions {
  supabase?: SupabaseClient;
  postCallForwarder?: PostCallForwarder | null;
}

export function buildRetellWebhookRouter(
  cache: TenantConfigCache,
  options: RetellWebhookRouterOptions = {},
): Hono {
  const router = new Hono();
  const supabase = options.supabase ?? createServiceSupabase();

  router.post("/webhook", async (c) => {
    const secret = process.env["RETELL_WEBHOOK_SECRET"];
    if (!secret) {
      logger.error({}, "RETELL_WEBHOOK_SECRET missing");
      return c.json({ error: "server_misconfigured" }, 500);
    }

    const rawBody = await c.req.text();
    const signature = c.req.header(RETELL_SIGNATURE_HEADER) ?? "";
    if (!verifyRetellSignature(rawBody, signature, secret)) {
      logger.warn({}, "rejected webhook with bad signature");
      return c.json({ error: "bad_signature" }, 401);
    }

    let payload: RetellWebhookPayload;
    try {
      payload = normalizeRetellWebhookPayload(JSON.parse(rawBody));
    } catch {
      return c.json({ error: "bad_payload" }, 400);
    }

    const mapping = await cache.resolveAgent(payload.agent_id);
    if (!mapping) {
      logger.warn({ agent_id: payload.agent_id }, "unknown agent_id on webhook");
      return c.json({ error: "unknown_agent" }, 404);
    }

    const tenantId = mapping.tenant_id;

    switch (payload.event) {
      case "call_started": {
        // Idempotent insert — retell_call_id has a unique constraint.
        const { error } = await supabase
          .from("calls")
          .insert({
            tenant_id: tenantId,
            retell_agent_id: payload.agent_id,
            retell_call_id: payload.call_id,
            direction: mapping.agent_kind === "demo" ? "demo" : "inbound",
            status: "in_progress",
            started_at: new Date(payload.start_timestamp).toISOString(),
          })
          .select()
          .maybeSingle();
        if (error && !isUniqueViolation(error)) {
          logger.error({ err: error.message, call_id: payload.call_id }, "call_started insert failed");
          return c.json({ error: "db_error" }, 500);
        }
        return c.json({ ok: true });
      }

      case "function_call": {
        // The actual tool dispatch happens via the /tools/* router that Retell calls
        // directly with a separate signed request. This branch exists for parity
        // when Retell sends function_call as a webhook event for logging.
        logger.info(
          {
            tenant_id: tenantId,
            call_id: payload.call_id,
            function: payload.function_name,
          },
          "function_call observed",
        );
        return c.json({ ok: true });
      }

      case "call_ended": {
        const durationMs = payload.duration_ms ?? payload.end_timestamp - payload.start_timestamp;
        const { error } = await supabase
          .from("calls")
          .update({
            status: "completed",
            ended_at: new Date(payload.end_timestamp).toISOString(),
            duration_seconds: durationMs >= 0 ? Math.round(durationMs / 1000) : null,
            transcript: payload.transcript ?? null,
            retell_inbound_minutes: payload.inbound_minutes ?? 0,
            retell_outbound_transfer_minutes: payload.outbound_transfer_minutes ?? 0,
          })
          .eq("retell_call_id", payload.call_id)
          .eq("tenant_id", tenantId); // belt-and-suspenders even with service role (U4)
        if (error) {
          logger.error({ err: error.message, call_id: payload.call_id }, "call_ended update failed");
          return c.json({ error: "db_error" }, 500);
        }

        const postCallForwarder = options.postCallForwarder ?? createPostCallForwarderFromEnv();
        if (!postCallForwarder) {
          logger.error({ call_id: payload.call_id }, "post-call forwarder missing");
          return c.json({ error: "post_call_misconfigured" }, 500);
        }

        try {
          await postCallForwarder.forwardCallEnded(payload);
        } catch (err) {
          logger.error(
            { err: (err as Error).message, call_id: payload.call_id },
            "post-call forward failed",
          );
          return c.json({ error: "post_call_failed" }, 502);
        }

        return c.json({ ok: true, post_call_triggered: true });
      }

      case "call_analyzed": {
        logger.info({ tenant_id: tenantId, call_id: payload.call_id }, "call_analyzed observed");
        return c.json({ ok: true });
      }

      default: {
        logger.warn({ event: (payload as RetellWebhookPayload).event }, "unknown webhook event");
        return c.json({ error: "unknown_event" }, 400);
      }
    }
  });

  return router;
}

function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" || (error.message?.includes("duplicate key") ?? false);
}

function createPostCallForwarderFromEnv(): PostCallForwarder | null {
  const baseUrl = process.env["POST_CALL_WORKER_URL"]?.trim();
  const secret = process.env["POST_CALL_WEBHOOK_SECRET"]?.trim();
  if (!baseUrl || !secret) return null;
  const endpoint = `${baseUrl.replace(/\/$/, "")}/calls/ended`;

  return {
    async forwardCallEnded(payload) {
      const response = await fetch(endpoint, {
        method: "POST",
        redirect: "manual",
        signal: AbortSignal.timeout(POST_CALL_FORWARD_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          [POST_CALL_SECRET_HEADER]: secret,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`post-call worker returned ${response.status}${body ? `: ${body}` : ""}`);
      }
    },
  };
}

// Seam marker kept for the static-analysis check + future R29 swap.
export const RETELL_SEAM = { _seam: "retell" as const };

function normalizeRetellWebhookPayload(body: unknown): RetellWebhookPayload {
  if (!isRecord(body)) throw new Error("Retell webhook body must be an object");

  const envelope = body as RetellWebhookEnvelope;
  const event = readString(envelope, "event");
  const call = isRecord(envelope.call) ? envelope.call : envelope;
  const agentId = readString(call, "agent_id");
  const callId = readString(call, "call_id");

  switch (event) {
    case "call_started":
      return {
        event,
        agent_id: agentId,
        call_id: callId,
        start_timestamp: readRequiredTimestamp(call, "start_timestamp"),
      };
    case "call_ended":
      return {
        event,
        agent_id: agentId,
        call_id: callId,
        start_timestamp: readRequiredTimestamp(call, "start_timestamp"),
        end_timestamp: readRequiredTimestamp(call, "end_timestamp"),
        transcript: readOptionalString(call, "transcript"),
        duration_ms: readOptionalNumber(call, "duration_ms"),
        inbound_minutes: readOptionalNumber(call, "inbound_minutes"),
        outbound_transfer_minutes: readOptionalNumber(call, "outbound_transfer_minutes"),
      };
    case "function_call":
      return {
        event,
        agent_id: agentId,
        call_id: callId,
        function_name: readString(envelope, "function_name"),
        arguments: isRecord(envelope.arguments) ? envelope.arguments : {},
      };
    case "call_analyzed":
      return {
        event,
        agent_id: agentId,
        call_id: callId,
      };
    default:
      return {
        event,
        agent_id: agentId,
        call_id: callId,
      } as RetellWebhookPayload;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Retell webhook missing ${key}`);
  return value;
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`Retell webhook ${key} must be a string`);
  return value;
}

function readOptionalNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Retell webhook ${key} must be a number`);
  }
  return value;
}

function readRequiredTimestamp(record: Record<string, unknown>, key: string): number {
  const value = readOptionalNumber(record, key);
  if (value === undefined) throw new Error(`Retell webhook missing ${key}`);
  return value;
}
