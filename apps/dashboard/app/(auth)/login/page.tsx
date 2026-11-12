/**
 * /login — magic-link sign-in (plan U18 + D6).
 *
 * Owner-operators submit their email, get a magic link, click it, and land
 * on /auth/callback which exchanges the code for a session and redirects to
 * (owner)/leads.
 *
 * Pattern: Variant A Local Operator Premium light surface.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabase } from "../../../lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in | RequestHandoff",
};

async function sendMagicLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/login?error=missing_email");
  }
  const supabase = await getSupabase();
  const origin =
    process.env["NEXT_PUBLIC_APP_URL"] ?? "https://requesthandoff.com";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/login?sent=1");
}

interface PageProps {
  searchParams: Promise<{ sent?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <main className="site-shell" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <div
        style={{
          maxWidth: "32rem",
          width: "100%",
          padding: "clamp(1.5rem, 4vw, 2.5rem)",
          background: "var(--paper-strong)",
          border: "1px solid rgba(24, 33, 31, 0.12)",
          borderRadius: "var(--rh-radius-md)",
          boxShadow: "var(--shadow)",
        }}
      >
        <p className="eyebrow">RequestHandoff</p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginBottom: "1rem" }}>
          Sign in to your dashboard
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.6rem" }}>
          We&apos;ll email you a one-time link. No password to remember.
        </p>

        {params.sent ? (
          <div
            style={{
              padding: "1rem 1.2rem",
              background: "var(--field)",
              border: "1px solid rgba(24, 33, 31, 0.12)",
              borderRadius: "var(--rh-radius-sm)",
              color: "var(--ink)",
            }}
          >
            <strong>Check your inbox.</strong> The link expires in 60 minutes. If you don&apos;t
            see it, check spam.
          </div>
        ) : (
          <form action={sendMagicLink}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.92rem",
                fontWeight: 700,
                marginBottom: "0.45rem",
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@yourshop.com"
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                fontSize: "1rem",
                border: "1px solid rgba(24, 33, 31, 0.2)",
                borderRadius: "var(--rh-radius-sm)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            />
            {params.error ? (
              <p style={{ color: "var(--accent-dark)", fontSize: "0.9rem", marginTop: "0.6rem" }}>
                {decodeURIComponent(params.error)}
              </p>
            ) : null}
            <button
              type="submit"
              className="primary-button"
              style={{ marginTop: "1.2rem", width: "100%" }}
            >
              Send magic link
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
