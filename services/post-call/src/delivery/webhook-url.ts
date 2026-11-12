/**
 * Generic outbound webhook delivery handler (plan U14, R19, AE4).
 *
 * Sends the structured lead JSON to a tenant-provided Zapier/Make/n8n/custom
 * webhook URL. This is the MVP long-tail integration path: hand off the lead
 * where the business already works without building a native connector first.
 */
import { assertSafeWebhookUrl, signWebhookBody } from "@requesthandoff/outbound-webhook";
import type { LeadRecord, TenantConfig } from "@requesthandoff/schema";

import { logger } from "../observability/logger.js";

export interface WebhookHttpClient {
  post(args: {
    url: string;
    body: string;
    headers: Record<string, string>;
  }): Promise<{ status: number; text?: string }>;
}

export interface WebhookDeliveryResult {
  status: "delivered" | "failed";
  attempts: number;
  provider_id?: string;
  error?: string;
}

const DEFAULT_MAX_ATTEMPTS = 2;
const DEFAULT_BACKOFF_SECONDS = [1];

interface DeliverWebhookArgs {
  client: WebhookHttpClient;
  tenant: TenantConfig;
  lead: LeadRecord;
  sleepFn?: (seconds: number) => Promise<void>;
  maxAttempts?: number;
  backoffSeconds?: number[];
}

export async function deliverLeadWebhook({
  client,
  tenant,
  lead,
  sleepFn = (s) => new Promise((r) => setTimeout(r, s * 1000)),
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  backoffSeconds = DEFAULT_BACKOFF_SECONDS,
}: DeliverWebhookArgs): Promise<WebhookDeliveryResult> {
  const url = tenant.outbound_webhook_url;
  if (!url) {
    return { status: "failed", attempts: 0, error: "tenant webhook URL is not configured" };
  }
  try {
    assertSafeWebhookUrl(url);
  } catch (err) {
    return { status: "failed", attempts: 0, error: (err as Error).message };
  }

  const body = JSON.stringify(renderWebhookPayload(tenant, lead));
  const headers = renderHeaders({ tenant, lead, body });
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client.post({ url, body, headers });
      if (response.status >= 200 && response.status < 300) {
        return { status: "delivered", attempts: attempt, provider_id: `http_${response.status}` };
      }

      lastError = `HTTP ${response.status}${response.text ? `: ${response.text.slice(0, 500)}` : ""}`;
      logger.warn(
        { tenant_id: tenant.id, lead_id: lead.id, attempt, status: response.status },
        "webhook delivery attempt failed",
      );

      if (response.status < 500) {
        return { status: "failed", attempts: attempt, error: lastError };
      }
    } catch (err) {
      lastError = (err as Error).message;
      logger.warn(
        { tenant_id: tenant.id, lead_id: lead.id, attempt, err: lastError },
        "webhook delivery attempt errored",
      );
    }

    if (attempt < maxAttempts) {
      const backoff = backoffSeconds[Math.min(attempt - 1, backoffSeconds.length - 1)] ?? 1;
      await sleepFn(backoff);
    }
  }

  return { status: "failed", attempts: maxAttempts, error: lastError };
}

export function renderWebhookPayload(tenant: TenantConfig, lead: LeadRecord) {
  return {
    event: "lead.captured",
    tenant: {
      id: tenant.id,
      business_name: tenant.business_name,
      vertical: tenant.vertical,
    },
    lead: {
      id: lead.id,
      call_id: lead.call_id,
      status: lead.status,
      caller_name: lead.caller_name,
      caller_phone: lead.caller_phone,
      caller_email: lead.caller_email,
      caller_address: lead.caller_address,
      service_category: lead.service_category,
      issue_description: lead.issue_description,
      location: lead.location,
      urgency_level: lead.urgency_level,
      urgency_confidence: lead.urgency_confidence,
      preferred_window: lead.preferred_window,
      recommended_action: lead.recommended_action,
      recommended_action_confidence: lead.recommended_action_confidence,
      missing_information: lead.missing_information,
      call_confidence_score: lead.call_confidence_score,
      rule_match_known: lead.rule_match_known,
      created_at: lead.created_at,
    },
  };
}

function renderHeaders({
  tenant,
  lead,
  body,
}: {
  tenant: TenantConfig;
  lead: LeadRecord;
  body: string;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-RequestHandoff-Event": "lead.captured",
    "X-RequestHandoff-Tenant-Id": tenant.id,
    "X-RequestHandoff-Lead-Id": lead.id,
  };
  if (tenant.outbound_webhook_secret) {
    headers["X-RequestHandoff-Signature"] = signWebhookBody(tenant.outbound_webhook_secret, body);
  }
  return headers;
}

export { assertSafeWebhookUrl };
