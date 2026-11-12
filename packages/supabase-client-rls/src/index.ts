/**
 * RLS-aware Supabase client (anon / authenticated user JWT).
 *
 * Use this in:
 *   - apps/dashboard/app/(owner)/* (tenant-facing)
 *   - apps/dashboard/app/(marketing)/*
 *   - apps/dashboard/app/(auth)/*
 *
 * RLS enforces tenant isolation automatically — every query is scoped to the
 * authenticated user's tenant via app.current_tenant_id() on the policy side.
 *
 * NEVER use this for admin or service paths — see @requesthandoff/supabase-client-service.
 */
import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";

export interface CookieAdapter {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
}

export function createBrowserSupabase() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see apps/dashboard/.env.example)",
    );
  }
  return createBrowserClient(url, key);
}

export function createServerSupabase(cookies: CookieAdapter) {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see apps/dashboard/.env.example)",
    );
  }
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookies.get(name);
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookies.remove(name, options);
      },
    },
  });
}
