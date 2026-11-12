"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServiceSupabase } from "@requesthandoff/supabase-client-service";
import { assertResolvedSafeWebhookUrl, postWebhookRequest } from "@requesthandoff/outbound-webhook";

import {
  buildWebhookSettingsUpdate,
  renderWebhookTestRequest,
  type TenantWebhookSettingsRow,
} from "../../../../../lib/outbound-webhook/settings";
import { requireFounderForPage } from "../../../../../lib/auth/require-founder";

export async function saveOutboundWebhookSettings(
  tenantId: string,
  formData: FormData,
): Promise<void> {
  await requireFounderForPage();
  const supabase = createServiceSupabase();
  const tenant = await loadTenantWebhookSettings(supabase, tenantId);
  const update = buildWebhookSettingsUpdate({
    rawUrl: formData.get("outbound_webhook_url"),
    rawSecret: formData.get("outbound_webhook_secret"),
    existingSecretCiphertext: tenant.outbound_webhook_secret_ciphertext,
    clearSecret: formData.get("clear_outbound_webhook_secret") === "on",
  });
  if (update.outbound_webhook_url) {
    await assertResolvedSafeWebhookUrl(update.outbound_webhook_url);
  }

  const { error } = await supabase.from("tenants").update(update).eq("id", tenantId);
  if (error) {
    throw new Error(`webhook_settings_update_failed: ${error.message}`);
  }

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}/edit`);
  redirect(`/admin/tenants/${tenantId}/edit?saved=1`);
}

export async function sendOutboundWebhookTest(tenantId: string): Promise<void> {
  await requireFounderForPage();
  const supabase = createServiceSupabase();
  const tenant = await loadTenantWebhookSettings(supabase, tenantId);
  const request = renderWebhookTestRequest({ tenant });
  const response = await postWebhookRequest({
    url: request.url,
    body: request.body,
    headers: request.headers,
    timeoutMs: 8_000,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`webhook_test_failed: HTTP ${response.status} ${response.text.slice(0, 300)}`);
  }

  redirect(`/admin/tenants/${tenantId}/edit?tested=1`);
}

async function loadTenantWebhookSettings(
  supabase: ReturnType<typeof createServiceSupabase>,
  tenantId: string,
): Promise<TenantWebhookSettingsRow> {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, business_name, outbound_webhook_url, outbound_webhook_secret_ciphertext")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) {
    throw new Error(`tenant_load_failed: ${error.message}`);
  }
  if (!data) {
    throw new Error("tenant_not_found");
  }
  return data as TenantWebhookSettingsRow;
}
