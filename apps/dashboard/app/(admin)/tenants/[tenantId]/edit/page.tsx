/**
 * /admin/tenants/[tenantId]/edit — founder-managed tenant handoff settings.
 *
 * U20 keeps this intentionally narrow: configure the generic outbound webhook
 * destination and optional signing secret. Native CRM connectors remain outside
 * MVP scope; RequestHandoff hands structured leads into the tool the operator
 * already uses.
 */
import type { Metadata } from "next";

import { createServiceSupabase } from "@requesthandoff/supabase-client-service";

import { OutboundWebhookSettingsForm } from "../../../../components/outbound-webhook-settings-form";
import { requireFounderForPage } from "../../../../../lib/auth/require-founder";
import { saveOutboundWebhookSettings, sendOutboundWebhookTest } from "./actions";

export const metadata: Metadata = { title: "Tenant settings | Founder admin" };

interface PageProps {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ saved?: string; tested?: string }>;
}

interface TenantSettingsRow {
  id: string;
  business_name: string;
  vertical: string;
  plan: string;
  status: string;
  outbound_webhook_url: string | null;
  outbound_webhook_secret_ciphertext: string | null;
}

async function loadTenant(tenantId: string): Promise<TenantSettingsRow | null> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "id, business_name, vertical, plan, status, outbound_webhook_url, outbound_webhook_secret_ciphertext",
    )
    .eq("id", tenantId)
    .maybeSingle();
  if (error) {
    throw new Error(`tenant_load_failed: ${error.message}`);
  }
  return data as TenantSettingsRow | null;
}

export default async function TenantEditPage({ params, searchParams }: PageProps) {
  await requireFounderForPage();
  const { tenantId } = await params;
  const { saved, tested } = await searchParams;
  const tenant = await loadTenant(tenantId);

  if (!tenant) {
    return (
      <section style={{ maxWidth: "48rem" }}>
        <a href="/admin/tenants" style={{ color: "rgba(237, 243, 234, 0.62)" }}>
          Back to tenants
        </a>
        <h1 style={{ marginTop: "1rem" }}>Tenant not found</h1>
      </section>
    );
  }

  const saveAction = saveOutboundWebhookSettings.bind(null, tenant.id);
  const testAction = sendOutboundWebhookTest.bind(null, tenant.id);
  const hasSecret = Boolean(tenant.outbound_webhook_secret_ciphertext);
  const canTest = Boolean(tenant.outbound_webhook_url);

  return (
    <section style={{ maxWidth: "62rem" }}>
      <a href="/admin/tenants" style={{ color: "rgba(237, 243, 234, 0.62)" }}>
        Back to tenants
      </a>

      <header style={{ marginTop: "1.2rem", marginBottom: "1.6rem" }}>
        <p
          style={{
            color: "var(--accent)",
            fontSize: "0.78rem",
            fontWeight: 850,
            letterSpacing: "0.12em",
            marginBottom: "0.4rem",
            textTransform: "uppercase",
          }}
        >
          Tenant settings
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", lineHeight: 0.95 }}>
          {tenant.business_name}
        </h1>
        <p style={{ color: "rgba(237, 243, 234, 0.62)", marginTop: "0.75rem" }}>
          {tenant.vertical} · {tenant.plan} · {tenant.status}
        </p>
      </header>

      <OutboundWebhookSettingsForm
        canTest={canTest}
        hasSecret={hasSecret}
        primaryButtonBackground="var(--accent)"
        primaryButtonColor="#fff"
        saveAction={saveAction}
        saveButtonLabel="Save handoff settings"
        saved={Boolean(saved)}
        savedLabel="Webhook settings saved."
        testAction={testAction}
        tested={Boolean(tested)}
        testedLabel="Test delivery accepted by the webhook endpoint."
        urlHelp="RequestHandoff sends structured lead records here after capture. HTTPS public URLs only."
        urlLabel="Outbound webhook URL"
        webhookUrl={tenant.outbound_webhook_url}
      />
    </section>
  );
}
