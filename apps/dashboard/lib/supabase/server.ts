/**
 * Next.js server-side Supabase client adapter (plan U18).
 *
 * Wraps @requesthandoff/supabase-client-rls with Next 15's cookies() API so
 * the server-rendered Supabase queries inherit the magic-link session cookie.
 */
import { cookies } from "next/headers";

import { createServerSupabase } from "@requesthandoff/supabase-client-rls";

export async function getSupabase() {
  const cookieStore = await cookies();
  return createServerSupabase({
    get(name) {
      return cookieStore.get(name)?.value;
    },
    set(name, value, options) {
      try {
        cookieStore.set({ name, value, ...options });
      } catch {
        // Server Components cannot set cookies; ignore. Route Handlers + Server
        // Actions can, and this adapter handles both via the same interface.
      }
    },
    remove(name, options) {
      try {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      } catch {
        // see above
      }
    },
  });
}
