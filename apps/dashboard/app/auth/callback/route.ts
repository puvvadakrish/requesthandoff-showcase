/**
 * /auth/callback — magic-link code → session exchange (plan U18 + D6).
 *
 * Supabase redirects here with `?code=<one-time-code>` after the owner clicks
 * the magic link in their email. We exchange it for a session cookie via the
 * server-side Supabase client, then redirect into the owner dashboard.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getSupabase } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }
  const supabase = await getSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url),
    );
  }
  return NextResponse.redirect(new URL("/leads", url));
}
