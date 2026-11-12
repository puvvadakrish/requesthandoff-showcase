/**
 * services/post-call — background worker entrypoint (plan U10–U16).
 *
 * Render Background Worker in Virginia (us-east-1). Receives Retell call_ended
 * webhook (HTTP), runs Gemini 3 Flash extraction, fans out delivery to email +
 * Jobber + generic webhook URL.
 *
 * MVP wires:
 *   - U10 extraction (src/extract/gemini.ts) — done
 *   - U11 email delivery (src/delivery/email.ts) — done
 *   - U15 escalation logging + retry (src/retry/escalation.ts) — done
 *   - U10/U11 call-ended pipeline (src/pipeline/call-ended.ts) — done
 *
 * Wired in Week 5+ (per plan):
 *   - U12 Jobber delivery
 *   - U14 generic webhook URL delivery
 *   - U16 weekly ROI cron
 */
import { serve } from "@hono/node-server";

import { buildPostCallAppFromEnv } from "./app.js";
import { logger } from "./observability/logger.js";

const app = buildPostCallAppFromEnv();

const port = Number(process.env["PORT"] ?? 8081);
serve({ fetch: app.fetch, port });
logger.info({ port }, "post-call worker listening");
