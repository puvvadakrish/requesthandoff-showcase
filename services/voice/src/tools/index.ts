/**
 * Hot-path tool router (plan U6 + U7).
 *
 * Mounts the four function-call endpoints behind /tools/. Each endpoint:
 *   - Resolves the tenant via agent_id (NEVER from request body — round 3 ADV-R3-1)
 *   - Loads the composed playbook (cached)
 *   - Dispatches to the pure-function tool handler
 *   - Logs latency + outcome (R27)
 *
 * NO LLM IMPORTS allowed in this directory tree. Enforced at lint time.
 */
import { Hono } from "hono";

import type { TenantConfigCache } from "../cache/tenant-config.js";
import { logger } from "../observability/logger.js";
import { composePlaybook } from "../runtime/playbook.js";
import { checkHours } from "./check-hours.js";
import { checkServiceArea, type CheckServiceAreaArgs } from "./check-service-area.js";
import { escalateNow, type EscalateNowArgs } from "./escalate-now.js";
import { requestScheduleWindow } from "./request-schedule-window.js";
import type { ToolContext, ToolResponse } from "./types.js";

interface DispatchArgs {
  agentId: string;
  callId: string;
  cache: TenantConfigCache;
}

async function buildContext({
  agentId,
  callId,
  cache,
}: DispatchArgs): Promise<ToolContext | null> {
  const mapping = await cache.resolveAgent(agentId);
  if (!mapping) return null;
  const tenant = await cache.getTenant(mapping.tenant_id);
  if (!tenant) return null;
  const scaffoldChain = await cache.getScaffoldChain(tenant.vertical);
  const composed = composePlaybook({ tenant, scaffoldChain });
  return {
    tenant,
    urgencyRules: composed.urgency_rules,
    multiStateWarningRequired: composed.multi_state_warning_required,
    callId,
    now: new Date(),
  };
}

function logResult(tool: string, ctx: ToolContext, response: ToolResponse<unknown>): void {
  logger.info(
    {
      tenant_id: ctx.tenant.id,
      tool,
      latency_ms: response.latency_ms,
      outcome: response.ok ? "ok" : `err:${response.error_code}`,
      call_id: ctx.callId,
    },
    "tool call",
  );
}

export function buildToolsRouter(cache: TenantConfigCache): Hono {
  const router = new Hono();

  router.post("/check_hours", async (c) => {
    const body = await c.req.json<{ agent_id: string; call_id: string }>();
    const ctx = await buildContext({ agentId: body.agent_id, callId: body.call_id, cache });
    if (!ctx) return c.json({ ok: false, error_code: "tenant_not_found" }, 404);
    const result = checkHours(ctx);
    logResult("check_hours", ctx, result);
    return c.json(result);
  });

  router.post("/check_service_area", async (c) => {
    const body = await c.req.json<{ agent_id: string; call_id: string; args: CheckServiceAreaArgs }>();
    const ctx = await buildContext({ agentId: body.agent_id, callId: body.call_id, cache });
    if (!ctx) return c.json({ ok: false, error_code: "tenant_not_found" }, 404);
    const result = checkServiceArea(ctx, body.args ?? {});
    logResult("check_service_area", ctx, result);
    return c.json(result);
  });

  router.post("/request_schedule_window", async (c) => {
    const body = await c.req.json<{ agent_id: string; call_id: string }>();
    const ctx = await buildContext({ agentId: body.agent_id, callId: body.call_id, cache });
    if (!ctx) return c.json({ ok: false, error_code: "tenant_not_found" }, 404);
    const result = requestScheduleWindow(ctx);
    logResult("request_schedule_window", ctx, result);
    return c.json(result);
  });

  router.post("/escalate_now", async (c) => {
    const body = await c.req.json<{ agent_id: string; call_id: string; args: EscalateNowArgs }>();
    const ctx = await buildContext({ agentId: body.agent_id, callId: body.call_id, cache });
    if (!ctx) return c.json({ ok: false, error_code: "tenant_not_found" }, 404);
    const result = escalateNow(ctx, body.args ?? { caller_phrase: "" });
    logResult("escalate_now", ctx, result);
    return c.json(result);
  });

  return router;
}
