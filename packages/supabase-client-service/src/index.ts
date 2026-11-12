/**
 * Service-role Supabase client (RLS bypass).
 *
 * USE ONLY in:
 *   - services/voice (Retell webhook + hot-path tool handlers)
 *   - services/post-call (call_ended ingest, extraction, delivery, cron)
 *   - apps/dashboard/app/(admin)/*  (founder admin routes ONLY)
 *   - apps/dashboard/app/api/admin/* (founder API routes ONLY)
 *
 * This client uses the service-role JWT and bypasses ALL RLS policies.
 * The ESLint `no-restricted-imports` boundary forbids importing this from
 * non-admin dashboard routes; if that boundary fails, tenant data leaks.
 *
 * SAFETY (per plan U4 + round 3 ADV-R3-1):
 *   - Always derive tenant_id from a server-owned source (agent_to_tenant
 *     mapping, founder JWT claim, or an internal bootstrap flow).
 *   - NEVER read tenant_id from an inbound webhook body or untrusted client input.
 *   - Add belt-and-suspenders `eq("tenant_id", X)` to every query even though
 *     RLS is bypassed.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createServiceSupabase(): SupabaseClient {
  const url = process.env["SUPABASE_URL"] ?? process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (see service-side .env.example)",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolve a Retell agent_id to its owning tenant_id via the server-owned
 * agent_to_tenant mapping. This is the ONLY safe way for the hot-path service
 * to learn which tenant a webhook belongs to (per plan U4 spoofed-webhook test).
 *
 * Returns null when the agent_id is unknown — caller should reject the webhook.
 */
export async function resolveTenantFromAgent(
  client: SupabaseClient,
  retellAgentId: string,
): Promise<{ tenant_id: string; agent_kind: "production" | "demo" } | null> {
  const { data, error } = await client
    .from("agent_to_tenant")
    .select("tenant_id, agent_kind")
    .eq("retell_agent_id", retellAgentId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return data as { tenant_id: string; agent_kind: "production" | "demo" };
}
