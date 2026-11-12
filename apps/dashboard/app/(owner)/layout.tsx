/**
 * Owner dashboard layout (plan U19 + D16 Variant B Dispatch Console).
 *
 * Dense, scannable, calm. IBM Plex Sans surface, monospace for timestamps.
 * Tenant-scoped via Supabase Auth + RLS — no service role here.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSupabase } from "../../lib/supabase/server";

const navItems: { href: string; label: string }[] = [
  { href: "/leads", label: "Leads" },
  { href: "/escalations", label: "Escalations" },
  { href: "/usage", label: "Plan usage" },
  { href: "/reports", label: "ROI archive" },
  { href: "/settings", label: "Settings" },
];

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp?.user) {
    redirect("/login");
  }
  const email = userResp.user.email ?? "owner";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0f1413",
        color: "#edf3ea",
        fontFamily:
          'IBM Plex Sans, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <nav
        style={{
          alignItems: "center",
          background: "rgba(15, 20, 19, 0.92)",
          borderBottom: "1px solid rgba(237, 243, 234, 0.1)",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "auto 1fr auto",
          padding: "1rem clamp(1rem, 4vw, 2.5rem)",
          position: "sticky",
          top: 0,
          zIndex: 4,
          backdropFilter: "blur(16px)",
        }}
      >
        <Link
          href="/leads"
          style={{ display: "flex", gap: "0.65rem", alignItems: "center", fontWeight: 850 }}
        >
          <span
            style={{
              alignItems: "center",
              background: "#d7b35d",
              borderRadius: "0.35rem",
              color: "#0f1413",
              display: "inline-flex",
              fontSize: "0.74rem",
              height: "2rem",
              justifyContent: "center",
              width: "2rem",
            }}
          >
            RH
          </span>
          <span>RequestHandoff</span>
        </Link>
        <div style={{ display: "flex", gap: "1.5rem", color: "rgba(237, 243, 234, 0.62)", fontSize: "0.92rem" }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <span style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "0.88rem" }}>{email}</span>
      </nav>

      <main style={{ padding: "clamp(1.5rem, 4vw, 3rem)" }}>{children}</main>
    </div>
  );
}
