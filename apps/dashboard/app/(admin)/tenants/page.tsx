/**
 * /admin/tenants — multi-tenant founder view (plan U21).
 */
import type { Metadata } from "next";

import { createServiceSupabase } from "@requesthandoff/supabase-client-service";

export const metadata: Metadata = { title: "Tenants | Founder admin" };

interface TenantRow {
  id: string;
  business_name: string;
  vertical: string;
  plan: string;
  status: string;
  primary_state: string;
  created_at: string;
}

async function loadAll(): Promise<TenantRow[]> {
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from("tenants")
    .select("id, business_name, vertical, plan, status, primary_state, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as TenantRow[];
}

export default async function TenantsPage() {
  const tenants = await loadAll();

  return (
    <section>
      <p
        style={{
          color: "var(--accent)",
          fontSize: "0.78rem",
          fontWeight: 850,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "0.4rem",
        }}
      >
        Tenants
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", lineHeight: 0.95, marginBottom: "1.4rem" }}>
        {tenants.length} active or draft
      </h1>

      <div
        style={{
          background: "rgba(237, 243, 234, 0.04)",
          border: "1px solid rgba(237, 243, 234, 0.12)",
          borderRadius: "var(--rh-radius-sm)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 8rem 8rem 8rem 7rem",
            gap: "1rem",
            padding: "0.8rem 1.2rem",
            borderBottom: "1px solid rgba(237, 243, 234, 0.12)",
            color: "rgba(237, 243, 234, 0.5)",
            fontSize: "0.74rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>Business</span>
          <span>Vertical</span>
          <span>Plan</span>
          <span>Status</span>
          <span>State</span>
        </div>
        {tenants.length === 0 ? (
          <div style={{ padding: "1.8rem 1.2rem", color: "rgba(237, 243, 234, 0.62)" }}>
            No tenants yet. Use the pre-demo extractor to create the first draft.
          </div>
        ) : (
          tenants.map((t) => (
            <a
              key={t.id}
              href={`/admin/tenants/${t.id}/edit`}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 8rem 8rem 8rem 7rem",
                gap: "1rem",
                padding: "1rem 1.2rem",
                borderTop: "1px solid rgba(237, 243, 234, 0.08)",
                color: "#edf3ea",
              }}
            >
              <strong>{t.business_name}</strong>
              <span style={{ color: "rgba(237, 243, 234, 0.7)" }}>{t.vertical}</span>
              <span style={{ color: "rgba(237, 243, 234, 0.7)" }}>{t.plan}</span>
              <span style={{ color: "rgba(237, 243, 234, 0.7)" }}>{t.status}</span>
              <span
                style={{
                  fontFamily: "var(--rh-font-mono)",
                  color: "rgba(237, 243, 234, 0.7)",
                }}
              >
                {t.primary_state}
              </span>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
