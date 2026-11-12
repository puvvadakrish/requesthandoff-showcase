/**
 * Email delivery handler (plan U11, R17, AE4).
 *
 * Always-on baseline at MVP — every captured lead gets an email regardless of
 * other configured integrations. Cannot be disabled by the tenant.
 */
import type { LeadRecord, TenantConfig } from "@requesthandoff/schema";

import { logger } from "../observability/logger.js";

export interface EmailClient {
  send(args: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
    headers?: Record<string, string>;
  }): Promise<{ id: string }>;
}

export interface EmailDeliveryResult {
  status: "delivered" | "failed";
  attempts: number;
  provider_id?: string;
  error?: string;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BACKOFF_SECONDS = [1, 4, 9, 16, 25]; // quadratic, capped

interface DeliverArgs {
  client: EmailClient;
  tenant: TenantConfig;
  lead: LeadRecord;
  fromAddress: string;
  /** Test hook — defaults to setTimeout-based async sleep. */
  sleepFn?: (seconds: number) => Promise<void>;
  /** Override retry policy for tests. */
  maxAttempts?: number;
  backoffSeconds?: number[];
}

export async function deliverLeadEmail({
  client,
  tenant,
  lead,
  fromAddress,
  sleepFn = (s) => new Promise((r) => setTimeout(r, s * 1000)),
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  backoffSeconds = DEFAULT_BACKOFF_SECONDS,
}: DeliverArgs): Promise<EmailDeliveryResult> {
  const subject = renderSubject(lead);
  const text = renderTextBody(tenant, lead);
  const html = renderHtmlBody(tenant, lead);

  let lastError = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await client.send({
        from: fromAddress,
        to: tenant.escalation_email,
        subject,
        text,
        html,
        headers: {
          "X-RequestHandoff-Lead-Id": lead.id,
          "X-RequestHandoff-Tenant-Id": tenant.id,
          "X-RequestHandoff-Urgency": lead.urgency_level,
        },
      });
      return { status: "delivered", attempts: attempt, provider_id: result.id };
    } catch (err) {
      lastError = (err as Error).message;
      logger.warn(
        { tenant_id: tenant.id, lead_id: lead.id, attempt, err: lastError },
        "email send attempt failed",
      );
      if (attempt < maxAttempts) {
        const backoff = backoffSeconds[Math.min(attempt - 1, backoffSeconds.length - 1)] ?? 1;
        await sleepFn(backoff);
      }
    }
  }

  return { status: "failed", attempts: maxAttempts, error: lastError };
}

function renderSubject(lead: LeadRecord): string {
  const prefix =
    lead.urgency_level === "urgent"
      ? "[URGENT]"
      : lead.urgency_level === "elevated"
        ? "[Elevated]"
        : "[New lead]";
  return `${prefix} ${lead.service_category} — ${lead.caller_name ?? "caller"}`;
}

function renderTextBody(tenant: TenantConfig, lead: LeadRecord): string {
  return [
    `${tenant.business_name} — new lead captured`,
    ``,
    `Urgency: ${lead.urgency_level} (confidence ${lead.urgency_confidence.toFixed(2)})`,
    `Service: ${lead.service_category}`,
    `Caller: ${lead.caller_name ?? "(not captured)"}`,
    `Phone: ${lead.caller_phone ?? "(not captured)"}`,
    `Email: ${lead.caller_email ?? "(not captured)"}`,
    `Address: ${lead.caller_address ?? "(not captured)"}`,
    `Location: ${lead.location ?? "(not captured)"}`,
    `Preferred window: ${lead.preferred_window ?? "(not specified)"}`,
    ``,
    `Issue: ${lead.issue_description}`,
    ``,
    `Recommended action: ${lead.recommended_action} (confidence ${lead.recommended_action_confidence.toFixed(2)})`,
    `Overall confidence: ${lead.call_confidence_score.toFixed(2)}`,
    ``,
    lead.missing_information.length > 0
      ? `Missing fields the agent didn't capture: ${lead.missing_information.join(", ")}`
      : `All expected fields captured.`,
    ``,
    `View this lead in your dashboard.`,
  ].join("\n");
}

function renderHtmlBody(tenant: TenantConfig, lead: LeadRecord): string {
  const urgencyColor =
    lead.urgency_level === "urgent" ? "#c0392b" : lead.urgency_level === "elevated" ? "#d68910" : "#2c3e50";
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h2 style="margin: 0 0 8px 0;">${tenant.business_name}</h2>
  <p style="margin: 0 0 24px 0; color: #555;">New lead captured</p>
  <div style="border-left: 4px solid ${urgencyColor}; padding: 12px 16px; background: #f8f8f8; margin-bottom: 16px;">
    <strong style="color: ${urgencyColor};">Urgency: ${lead.urgency_level.toUpperCase()}</strong>
    (confidence ${lead.urgency_confidence.toFixed(2)})
  </div>
  <table style="border-collapse: collapse; width: 100%;">
    <tr><td style="padding: 4px 8px;"><strong>Service</strong></td><td style="padding: 4px 8px;">${escapeHtml(lead.service_category)}</td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Caller</strong></td><td style="padding: 4px 8px;">${escapeHtml(lead.caller_name ?? "(not captured)")}</td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Phone</strong></td><td style="padding: 4px 8px;">${escapeHtml(lead.caller_phone ?? "(not captured)")}</td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Address</strong></td><td style="padding: 4px 8px;">${escapeHtml(lead.caller_address ?? "(not captured)")}</td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Preferred window</strong></td><td style="padding: 4px 8px;">${escapeHtml(lead.preferred_window ?? "(not specified)")}</td></tr>
    <tr><td style="padding: 4px 8px; vertical-align: top;"><strong>Issue</strong></td><td style="padding: 4px 8px;">${escapeHtml(lead.issue_description)}</td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Recommended</strong></td><td style="padding: 4px 8px;">${escapeHtml(lead.recommended_action)}</td></tr>
  </table>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
