import { z } from "zod";
import {
  CallRecordSchema,
  LeadRecordSchema,
  TenantConfigSchema,
  type CallRecord,
  type DeliveryChannel,
  type DeliveryStatus,
  type LeadExtraction,
  type LeadRecord,
  type TenantConfig,
} from "@requesthandoff/schema";

import { deliverLeadEmail, type EmailClient } from "../delivery/email.js";
import { deliverLeadWebhook, type WebhookHttpClient } from "../delivery/webhook-url.js";
import { extractLead, type GeminiClient } from "../extract/gemini.js";
import { logger } from "../observability/logger.js";

export const RetellCallEndedPayloadSchema = z
  .object({
    event: z.literal("call_ended").optional(),
    agent_id: z.string().min(1),
    call_id: z.string().min(1),
    start_timestamp: z.number().int().optional(),
    end_timestamp: z.number().int().optional(),
    transcript: z.string().nullable().optional(),
    duration_ms: z.number().int().nonnegative().optional(),
    inbound_minutes: z.number().nonnegative().optional(),
    outbound_transfer_minutes: z.number().nonnegative().optional(),
  })
  .strict();

export type RetellCallEndedPayload = z.infer<typeof RetellCallEndedPayloadSchema>;

export interface AgentTenantMapping {
  tenant_id: string;
  agent_kind: "production" | "demo";
}

export interface DeliverySummary {
  channel: DeliveryChannel;
  status: DeliveryStatus | "skipped";
  attempts: number;
  provider_id?: string;
  error_message?: string;
}

export type PostCallPipelineResult =
  | {
      status: "delivered" | "delivery_failed" | "email_already_delivered";
      tenant_id: string;
      call_id: string;
      lead_id: string;
      extraction_status: "ok";
      deliveries: DeliverySummary[];
    }
  | {
      status: "manual_review";
      tenant_id: string;
      call_id: string;
      extraction_status: "manual_review";
      validation_error?: string;
      deliveries: DeliverySummary[];
    }
  | {
      status: "unknown_agent";
      retell_agent_id: string;
    }
  | {
      status: "tenant_not_found";
      tenant_id: string;
    }
  | {
      status: "missing_transcript";
      tenant_id: string;
      call_id: string;
    };

export interface PostCallStorage {
  resolveTenantFromAgent(retellAgentId: string): Promise<AgentTenantMapping | null>;
  loadTenantConfig(tenantId: string): Promise<TenantConfig | null>;
  upsertCompletedCall(args: {
    tenantId: string;
    retellAgentId: string;
    retellCallId: string;
    direction: CallRecord["direction"];
    startedAt: string;
    endedAt: string;
    durationSeconds: number | null;
    transcript: string | null;
    retellInboundMinutes: number;
    retellOutboundTransferMinutes: number;
  }): Promise<CallRecord>;
  updateCallCostTelemetry(args: {
    callId: string;
    geminiInputTokens: number;
    geminiOutputTokens: number;
    geminiCachedTokens: number;
    resendSends?: number;
  }): Promise<void>;
  upsertLeadForCall(args: {
    tenantId: string;
    callId: string;
    extraction: LeadExtraction;
  }): Promise<LeadRecord>;
  findLatestDelivery(args: {
    tenantId: string;
    leadId: string;
    channel: DeliveryChannel;
  }): Promise<{ status: DeliveryStatus; provider_id: string | null } | null>;
  recordDelivery(args: {
    tenantId: string;
    leadId: string;
    channel: DeliveryChannel;
    status: DeliveryStatus;
    attemptCount: number;
    providerId?: string;
    errorMessage?: string;
  }): Promise<void>;
}

export interface PostCallPipelineDeps {
  storage: PostCallStorage;
  geminiClient: GeminiClient;
  emailClient: EmailClient;
  emailFromAddress: string;
  webhookClient?: WebhookHttpClient;
}

export async function handleRetellCallEnded(
  payload: RetellCallEndedPayload,
  deps: PostCallPipelineDeps,
): Promise<PostCallPipelineResult> {
  const mapping = await deps.storage.resolveTenantFromAgent(payload.agent_id);
  if (!mapping) {
    logger.warn({ retell_agent_id: payload.agent_id }, "post-call rejected unknown agent");
    return { status: "unknown_agent", retell_agent_id: payload.agent_id };
  }

  const tenant = await deps.storage.loadTenantConfig(mapping.tenant_id);
  if (!tenant) {
    logger.error({ tenant_id: mapping.tenant_id }, "post-call tenant config missing");
    return { status: "tenant_not_found", tenant_id: mapping.tenant_id };
  }

  const call = await deps.storage.upsertCompletedCall({
    tenantId: tenant.id,
    retellAgentId: payload.agent_id,
    retellCallId: payload.call_id,
    direction: mapping.agent_kind === "demo" ? "demo" : "inbound",
    startedAt: timestampToIso(payload.start_timestamp) ?? new Date().toISOString(),
    endedAt: timestampToIso(payload.end_timestamp) ?? new Date().toISOString(),
    durationSeconds:
      payload.duration_ms !== undefined ? Math.round(payload.duration_ms / 1000) : null,
    transcript: payload.transcript ?? null,
    retellInboundMinutes: payload.inbound_minutes ?? 0,
    retellOutboundTransferMinutes: payload.outbound_transfer_minutes ?? 0,
  });

  if (!payload.transcript?.trim()) {
    logger.warn({ tenant_id: tenant.id, call_id: call.id }, "post-call missing transcript");
    return { status: "missing_transcript", tenant_id: tenant.id, call_id: call.id };
  }

  const extraction = await extractLead(deps.geminiClient, {
    transcript: payload.transcript,
    tenant: {
      business_name: tenant.business_name,
      vertical: tenant.vertical,
      services_offered: tenant.services_offered,
      services_not_offered: tenant.services_not_offered,
      coverage_zip_codes: tenant.coverage_zip_codes,
    },
    urgencyRulesAtCallTime: tenant.custom_urgency_rules,
    recommendedActionIds: ["callback_request", "warm_transfer_to_owner", "email_summary"],
  });

  if (extraction.status === "manual_review" || !extraction.lead) {
    await deps.storage.updateCallCostTelemetry({
      callId: call.id,
      geminiInputTokens: extraction.costTelemetry.input_tokens,
      geminiOutputTokens: extraction.costTelemetry.output_tokens,
      geminiCachedTokens: extraction.costTelemetry.cached_tokens,
    });
    logger.warn(
      { tenant_id: tenant.id, call_id: call.id, validation_error: extraction.validationError },
      "post-call extraction routed to manual review",
    );
    return {
      status: "manual_review",
      tenant_id: tenant.id,
      call_id: call.id,
      extraction_status: "manual_review",
      validation_error: extraction.validationError,
      deliveries: [],
    };
  }

  const lead = await deps.storage.upsertLeadForCall({
    tenantId: tenant.id,
    callId: call.id,
    extraction: extraction.lead,
  });

  const existingEmail = await deps.storage.findLatestDelivery({
    tenantId: tenant.id,
    leadId: lead.id,
    channel: "email",
  });
  const deliveries: DeliverySummary[] = [];

  if (existingEmail?.status === "delivered") {
    deliveries.push({
      channel: "email",
      status: "skipped",
      attempts: 0,
      provider_id: existingEmail.provider_id ?? undefined,
    });
  } else {
    const emailResult = await deliverLeadEmail({
      client: deps.emailClient,
      tenant,
      lead,
      fromAddress: deps.emailFromAddress,
    });

    await deps.storage.recordDelivery({
      tenantId: tenant.id,
      leadId: lead.id,
      channel: "email",
      status: emailResult.status,
      attemptCount: emailResult.attempts,
      providerId: emailResult.provider_id,
      errorMessage: emailResult.error,
    });

    deliveries.push({
      channel: "email",
      status: emailResult.status,
      attempts: emailResult.attempts,
      provider_id: emailResult.provider_id,
      error_message: emailResult.error,
    });
  }

  if (tenant.outbound_webhook_url && deps.webhookClient) {
    const existingWebhook = await deps.storage.findLatestDelivery({
      tenantId: tenant.id,
      leadId: lead.id,
      channel: "webhook_url",
    });

    if (existingWebhook?.status === "delivered") {
      deliveries.push({
        channel: "webhook_url",
        status: "skipped",
        attempts: 0,
        provider_id: existingWebhook.provider_id ?? undefined,
      });
    } else {
      const webhookResult = await deliverLeadWebhook({
        client: deps.webhookClient,
        tenant,
        lead,
      });

      await deps.storage.recordDelivery({
        tenantId: tenant.id,
        leadId: lead.id,
        channel: "webhook_url",
        status: webhookResult.status,
        attemptCount: webhookResult.attempts,
        providerId: webhookResult.provider_id,
        errorMessage: webhookResult.error,
      });

      deliveries.push({
        channel: "webhook_url",
        status: webhookResult.status,
        attempts: webhookResult.attempts,
        provider_id: webhookResult.provider_id,
        error_message: webhookResult.error,
      });
    }
  }

  const emailDelivery = deliveries.find((delivery) => delivery.channel === "email");
  const costTelemetryUpdate: Parameters<PostCallStorage["updateCallCostTelemetry"]>[0] = {
    callId: call.id,
    geminiInputTokens: extraction.costTelemetry.input_tokens,
    geminiOutputTokens: extraction.costTelemetry.output_tokens,
    geminiCachedTokens: extraction.costTelemetry.cached_tokens,
  };
  if (emailDelivery?.status === "delivered" || emailDelivery?.status === "failed") {
    costTelemetryUpdate.resendSends = emailDelivery.attempts;
  }
  await deps.storage.updateCallCostTelemetry(costTelemetryUpdate);

  const allConfiguredDeliveredOrSkipped = deliveries.every(
    (delivery) => delivery.status === "delivered" || delivery.status === "skipped",
  );
  const onlyEmailSkipped =
    deliveries.length === 1 &&
    deliveries[0]?.channel === "email" &&
    deliveries[0].status === "skipped";

  return {
    status: onlyEmailSkipped
      ? "email_already_delivered"
      : allConfiguredDeliveredOrSkipped
        ? "delivered"
        : "delivery_failed",
    tenant_id: tenant.id,
    call_id: call.id,
    lead_id: lead.id,
    extraction_status: "ok",
    deliveries,
  };
}

function timestampToIso(timestampMs: number | undefined): string | null {
  if (timestampMs === undefined) return null;
  return new Date(timestampMs).toISOString();
}

export function parseCallRecord(row: unknown): CallRecord {
  return CallRecordSchema.parse(coerceNumericTelemetry(row));
}

export function parseLeadRecord(row: unknown): LeadRecord {
  return LeadRecordSchema.parse(coerceNumericTelemetry(row));
}

export function parseTenantConfig(row: unknown): TenantConfig {
  return TenantConfigSchema.parse(row);
}

function coerceNumericTelemetry(row: unknown): unknown {
  if (!row || typeof row !== "object") return row;
  const copy = { ...(row as Record<string, unknown>) };
  for (const key of [
    "retell_inbound_minutes",
    "retell_outbound_transfer_minutes",
    "urgency_confidence",
    "recommended_action_confidence",
    "call_confidence_score",
    "attributed_value_usd",
  ]) {
    if (typeof copy[key] === "string") copy[key] = Number(copy[key]);
  }
  return copy;
}
