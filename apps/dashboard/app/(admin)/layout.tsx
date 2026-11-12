/**
 * Founder admin layout (plan U21).
 *
 * Every (admin)/* page route calls requireFounderForPage() which redirects
 * non-founders to /. The 404-style hide is UX, not security; the security
 * boundary lives in requireFounderForApi() on every /api/admin/* route.
 */
import type { ReactNode } from "react";

import { requireFounderForPage } from "../../lib/auth/require-founder";

const adminNav: { href: string; label: string }[] = [
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/extractor", label: "Pre-demo extractor" },
  { href: "/admin/cogs", label: "COGS dashboard" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const founder = await requireFounderForPage();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0f1413",
        color: "#edf3ea",
        fontFamily: 'IBM Plex Sans, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <nav
        style={{
          alignItems: "center",
          background: "rgba(15, 20, 19, 0.94)",
          borderBottom: "1px solid rgba(216, 173, 99, 0.3)",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "auto 1fr auto",
          padding: "1rem clamp(1rem, 4vw, 2.5rem)",
          position: "sticky",
          top: 0,
          zIndex: 4,
        }}
      >
        <a
          href="/admin/tenants"
          style={{ display: "flex", gap: "0.65rem", alignItems: "center", fontWeight: 850 }}
        >
          <span
            style={{
              alignItems: "center",
              background: "var(--accent)",
              borderRadius: "0.35rem",
              color: "#fff",
              display: "inline-flex",
              fontSize: "0.74rem",
              height: "2rem",
              justifyContent: "center",
              width: "2rem",
            }}
          >
            FD
          </span>
          <span>Founder admin</span>
        </a>
        <div style={{ display: "flex", gap: "1.4rem", color: "rgba(237, 243, 234, 0.62)", fontSize: "0.9rem" }}>
          {adminNav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <span style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "0.82rem" }}>{founder.email}</span>
      </nav>
      <main style={{ padding: "clamp(1.5rem, 4vw, 3rem)" }}>{children}</main>
    </div>
  );
}
