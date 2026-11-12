/**
 * requireFounder server helper (plan U21 — round 1 SEC-002 fix).
 *
 * Every (admin)/* page route AND /api/admin/* API route must call this as
 * the first line of code. The 404 on (admin)/* page routes is a UX nicety;
 * the security boundary is THIS server-side check, not the URL shape.
 *
 * Founder identity is gated by `is_founder = true` on the public.users row,
 * keyed by auth.uid(). The first founder seat is set manually in the
 * Supabase Dashboard.
 */
import { redirect } from "next/navigation";

import { getSupabase } from "../supabase/server";

export interface FounderClaim {
  user_id: string;
  email: string;
  tenant_id: string | null;
}

export async function requireFounderForPage(): Promise<FounderClaim> {
  const claim = await loadClaim();
  if (!claim) {
    // Non-founder OR unauthenticated → 404 to hide the route's existence.
    // The actual security check lives in API routes too — this is UX-only.
    redirect("/");
  }
  return claim;
}

export async function requireFounderForApi(): Promise<
  | { ok: true; claim: FounderClaim }
  | { ok: false; status: 401 | 403; error: string }
> {
  const supabase = await getSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp?.user) {
    return { ok: false, status: 401, error: "unauthenticated" };
  }
  const { data: row } = await supabase
    .from("users")
    .select("id, email, tenant_id, is_founder")
    .eq("id", userResp.user.id)
    .maybeSingle();
  if (!row?.is_founder) {
    return { ok: false, status: 403, error: "not_founder" };
  }
  return {
    ok: true,
    claim: {
      user_id: row.id,
      email: row.email,
      tenant_id: row.tenant_id,
    },
  };
}

async function loadClaim(): Promise<FounderClaim | null> {
  const supabase = await getSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp?.user) return null;
  const { data: row } = await supabase
    .from("users")
    .select("id, email, tenant_id, is_founder")
    .eq("id", userResp.user.id)
    .maybeSingle();
  if (!row?.is_founder) return null;
  return { user_id: row.id, email: row.email, tenant_id: row.tenant_id };
}
