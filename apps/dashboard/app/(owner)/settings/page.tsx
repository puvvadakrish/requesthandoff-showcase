/**
 * /settings — owner handoff settings.
 *
 * RequestHandoff stays integration-neutral here: owners configure where the
 * structured lead goes, without replacing their CRM, dispatch board, or inbox.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OutboundWebhookSettingsForm } from "../../components/outbound-webhook-settings-form";
import { getSupabase } from "../../../lib/supabase/server";
import { saveOwnerOutboundWebhookSettings, sendOwnerOutboundWebhookTest } from "./actions";

export const metadata: Metadata = { title: "Settings | RequestHandoff" };

interface PageProps {
  searchParams: Promise<{ saved?: string; tested?: string }>;
}

interface OwnerTenantSettingsRow {
  id: string;
  business_name: string;
  outbound_webhook_url: string | null;
  outbound_webhook_secret_ciphertext: string | null;
}

async function loadTenant(): Promise<OwnerTenantSettingsRow> {
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
  return data as OwnerTenantSettingsRow;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const [{ saved, tested }, tenant] = await Promise.all([searchParams, loadTenant()]);
  const hasSecret = Boolean(tenant.outbound_webhook_secret_ciphertext);
  const canTest = Boolean(tenant.outbound_webhook_url);

  return (
    <section style={{ maxWidth: "62rem" }}>
      <header style={{ marginBottom: "1.6rem" }}>
        <p
          style={{
            color: "#d7b35d",
            fontSize: "0.78rem",
            fontWeight: 850,
            letterSpacing: "0.12em",
            marginBottom: "0.4rem",
            textTransform: "uppercase",
          }}
        >
          Settings
        </p>
        <h1 style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.4rem)", lineHeight: 0.95 }}>
          Handoff destination
        </h1>
        <p style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "1rem", marginTop: "0.75rem" }}>
          Send captured leads for {tenant.business_name} into the tool your team already checks.
        </p>
      </header>

      <OutboundWebhookSettingsForm
        canTest={canTest}
        hasSecret={hasSecret}
        primaryButtonBackground="#d7b35d"
        primaryButtonColor="#0f1413"
        saveAction={saveOwnerOutboundWebhookSettings}
        saveButtonLabel="Save settings"
        saved={Boolean(saved)}
        savedLabel="Handoff settings saved."
        testAction={sendOwnerOutboundWebhookTest}
        tested={Boolean(tested)}
        testedLabel="Test delivery accepted by the webhook endpoint."
        urlHelp="RequestHandoff posts structured leads here after each captured call. HTTPS public URLs only."
        urlLabel="Webhook URL"
        webhookUrl={tenant.outbound_webhook_url}
      />
    </section>
  );
}
