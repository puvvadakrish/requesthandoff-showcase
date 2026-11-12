"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertResolvedSafeWebhookUrl, postWebhookRequest } from "@requesthandoff/outbound-webhook";

import {
  buildWebhookSettingsUpdate,
  renderWebhookTestRequest,
  type TenantWebhookSettingsRow,
} from "../../../lib/outbound-webhook/settings";
import { getSupabase } from "../../../lib/supabase/server";

export async function saveOwnerOutboundWebhookSettings(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  const tenant = await loadOwnerTenantWebhookSettings();
  const update = buildWebhookSettingsUpdate({
    rawUrl: formData.get("outbound_webhook_url"),
    rawSecret: formData.get("outbound_webhook_secret"),
    existingSecretCiphertext: tenant.outbound_webhook_secret_ciphertext,
    clearSecret: formData.get("clear_outbound_webhook_secret") === "on",
  });

  if (update.outbound_webhook_url) {
    await assertResolvedSafeWebhookUrl(update.outbound_webhook_url);
  }

  const { error } = await supabase.from("tenants").update(update).eq("id", tenant.id);
  if (error) {
    throw new Error(`webhook_settings_update_failed: ${error.message}`);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function sendOwnerOutboundWebhookTest(): Promise<void> {
  const tenant = await loadOwnerTenantWebhookSettings();
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

  redirect("/settings?tested=1");
}

async function loadOwnerTenantWebhookSettings(): Promise<TenantWebhookSettingsRow> {
  const supabase = await getSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp?.user) {
    redirect("/login");
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", userResp.user.id)
    .maybeSingle();
  if (userError) {
    throw new Error(`user_load_failed: ${userError.message}`);
  }
  if (!userRow?.tenant_id) {
    throw new Error("tenant_not_found");
  }

  const { data, error } = await supabase
    .from("tenants")
    .select("id, business_name, outbound_webhook_url, outbound_webhook_secret_ciphertext")
    .eq("id", userRow.tenant_id)
    .maybeSingle();
  if (error) {
    throw new Error(`tenant_load_failed: ${error.message}`);
  }
  if (!data) {
    throw new Error("tenant_not_found");
  }
  return data as TenantWebhookSettingsRow;
}
