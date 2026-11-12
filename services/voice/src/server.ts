/**
 * services/voice — Hono server entrypoint (plan U6).
 *
 * Always-on Render Web Service in Virginia (us-east-1), co-located with
 * Supabase Postgres. Handles Retell function-call (mid-call tool) endpoints
 * with a hard p99 < 150ms latency budget.
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { SupabaseTenantLoader } from "./cache/loader-supabase.js";
import { TenantConfigCache } from "./cache/tenant-config.js";
import { logger } from "./observability/logger.js";
import { buildRetellWebhookRouter, RETELL_SEAM } from "./runtime/retell.js";
import { buildToolsRouter } from "./tools/index.js";

const cache = new TenantConfigCache(new SupabaseTenantLoader());

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    status: "ok",
    runtime: RETELL_SEAM._seam,
    region: process.env["RENDER_REGION"] ?? "local",
  }),
);

app.route("/tools", buildToolsRouter(cache));
app.route("/retell", buildRetellWebhookRouter(cache));

const port = Number(process.env["PORT"] ?? 8080);
serve({ fetch: app.fetch, port });
logger.info({ port }, "voice service listening");
