import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptWebhookSecret } from "@requesthandoff/outbound-webhook";
import {
  createServiceSupabase,
  resolveTenantFromAgent,
} from "@requesthandoff/supabase-client-service";
import type { DeliveryChannel, DeliveryStatus, LeadExtraction } from "@requesthandoff/schema";

import {
  parseCallRecord,
  parseLeadRecord,
  parseTenantConfig,
  type AgentTenantMapping,
  type PostCallStorage,
} from "../pipeline/call-ended.js";

export class SupabasePostCallStorage implements PostCallStorage {
  constructor(private readonly client: SupabaseClient = createServiceSupabase()) {}

  async resolveTenantFromAgent(retellAgentId: string): Promise<AgentTenantMapping | null> {
    const mapping = await resolveTenantFromAgent(this.client, retellAgentId);
    if (!mapping) return null;
    return {
      tenant_id: mapping.tenant_id,
      agent_kind: mapping.agent_kind === "demo" ? "demo" : "production",
    };
  }

  async loadTenantConfig(tenantId: string) {
    const { data, error } = await this.client
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();
    if (error) throw error;
    return data ? parseTenantConfig(withDecryptedWebhookSecret(data)) : null;
  }

  async upsertCompletedCall(args: Parameters<PostCallStorage["upsertCompletedCall"]>[0]) {
    const { data, error } = await this.client
      .from("calls")
      .upsert(
        {
          tenant_id: args.tenantId,
          retell_agent_id: args.retellAgentId,
          retell_call_id: args.retellCallId,
          direction: args.direction,
          status: "completed",
          started_at: args.startedAt,
          ended_at: args.endedAt,
          duration_seconds: args.durationSeconds,
          transcript: args.transcript,
          retell_inbound_minutes: args.retellInboundMinutes,
          retell_outbound_transfer_minutes: args.retellOutboundTransferMinutes,
        },
        { onConflict: "retell_call_id" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return parseCallRecord(data);
  }

  async updateCallCostTelemetry(args: Parameters<PostCallStorage["updateCallCostTelemetry"]>[0]) {
    const update: Record<string, number> = {
      gemini_input_tokens: args.geminiInputTokens,
      gemini_output_tokens: args.geminiOutputTokens,
      gemini_cached_tokens: args.geminiCachedTokens,
    };
    if (args.resendSends !== undefined) update["resend_sends"] = args.resendSends;

    const { error } = await this.client.from("calls").update(update).eq("id", args.callId);
    if (error) throw error;
  }

  async upsertLeadForCall(args: { tenantId: string; callId: string; extraction: LeadExtraction }) {
    const { data, error } = await this.client
      .from("leads")
      .upsert(
        {
          tenant_id: args.tenantId,
          call_id: args.callId,
          ...args.extraction,
          status: "new",
          attributed_value_usd: null,
        },
        { onConflict: "call_id" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return parseLeadRecord(data);
  }

  async findLatestDelivery(args: { tenantId: string; leadId: string; channel: DeliveryChannel }) {
    const { data, error } = await this.client
      .from("deliveries")
      .select("status, provider_id")
      .eq("tenant_id", args.tenantId)
      .eq("lead_id", args.leadId)
      .eq("channel", args.channel)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return data as { status: DeliveryStatus; provider_id: string | null };
  }

  async recordDelivery(args: Parameters<PostCallStorage["recordDelivery"]>[0]) {
    const { error } = await this.client.from("deliveries").insert({
      tenant_id: args.tenantId,
      lead_id: args.leadId,
      channel: args.channel,
      status: args.status,
      attempt_count: args.attemptCount,
      last_attempt_at: new Date().toISOString(),
      next_attempt_at: null,
      error_message: args.errorMessage ?? null,
      provider_id: args.providerId ?? null,
    });
    if (error) throw error;
  }
}

function withDecryptedWebhookSecret(row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row };
  const ciphertext = copy["outbound_webhook_secret_ciphertext"];
  delete copy["outbound_webhook_secret_ciphertext"];
  if (typeof ciphertext === "string" && ciphertext.trim()) {
    copy["outbound_webhook_secret"] = decryptWebhookSecret(ciphertext);
  }
  return copy;
}
