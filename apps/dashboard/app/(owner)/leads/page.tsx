/**
 * /leads — owner lead list (plan U19 + D16 Variant B Dispatch Console).
 *
 * Sort: urgent-unread first, then newest (round 1 DESIGN-001).
 * Empty state: "Your line is live..." (round 1 DESIGN-004).
 */
import type { Metadata } from "next";

import { getSupabase } from "../../../lib/supabase/server";

export const metadata: Metadata = { title: "Leads | RequestHandoff" };

interface LeadRow {
  id: string;
  service_category: string;
  caller_name: string | null;
  location: string | null;
  urgency_level: "standard" | "elevated" | "urgent";
  status: "new" | "contacted" | "booked" | "lost" | "spam";
  call_confidence_score: number;
  created_at: string;
}

const URGENCY_BADGE: Record<LeadRow["urgency_level"], { label: string; color: string }> = {
  urgent: { label: "URGENT", color: "#c0392b" },
  elevated: { label: "ELEVATED", color: "#d68910" },
  standard: { label: "STANDARD", color: "#7d8b85" },
};

const STATUS_LABEL: Record<LeadRow["status"], string> = {
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  lost: "Lost",
  spam: "Spam",
};

async function loadLeads(): Promise<LeadRow[]> {
  const supabase = await getSupabase();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, service_category, caller_name, location, urgency_level, status, call_confidence_score, created_at",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("loadLeads failed", error);
    return [];
  }
  const rows = (data ?? []) as LeadRow[];
  // Sort: urgent first (and within that, newest first); then by created_at desc.
  return rows.sort((a, b) => {
    const aRank = a.urgency_level === "urgent" ? 0 : a.urgency_level === "elevated" ? 1 : 2;
    const bRank = b.urgency_level === "urgent" ? 0 : b.urgency_level === "elevated" ? 1 : 2;
    if (aRank !== bRank) return aRank - bRank;
    return b.created_at.localeCompare(a.created_at);
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function LeadsPage() {
  const leads = await loadLeads();

  if (leads.length === 0) {
    return (
      <section style={{ maxWidth: "48rem" }}>
        <p
          style={{
            color: "#d7b35d",
            fontSize: "0.78rem",
            fontWeight: 850,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Leads · last 30 days
        </p>
        <h1 style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)", lineHeight: 0.95, marginBottom: "1rem" }}>
          Your line is live.
        </h1>
        <p style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "1.1rem", maxWidth: "40rem" }}>
          The next call that comes in while you&apos;re unavailable will appear here. Urgent
          escalations sort to the top automatically.
        </p>
      </section>
    );
  }

  return (
    <section>
      <header style={{ marginBottom: "1.6rem" }}>
        <p
          style={{
            color: "#d7b35d",
            fontSize: "0.78rem",
            fontWeight: 850,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "0.4rem",
          }}
        >
          Leads · last 30 days
        </p>
        <h1 style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.4rem)", lineHeight: 0.95 }}>
          {leads.length} captured lead{leads.length === 1 ? "" : "s"}
        </h1>
      </header>

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
            gridTemplateColumns: "8rem 1fr 12rem 7rem 7rem",
            gap: "1rem",
            padding: "0.8rem 1.2rem",
            borderBottom: "1px solid rgba(237, 243, 234, 0.12)",
            color: "rgba(237, 243, 234, 0.5)",
            fontSize: "0.76rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>Time</span>
          <span>Caller / service</span>
          <span>Location</span>
          <span>Urgency</span>
          <span>Status</span>
        </div>
        {leads.map((lead) => {
          const badge = URGENCY_BADGE[lead.urgency_level];
          const lowConfidence = lead.call_confidence_score < 0.6;
          return (
            <a
              key={lead.id}
              href={`/leads/${lead.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "8rem 1fr 12rem 7rem 7rem",
                gap: "1rem",
                padding: "1rem 1.2rem",
                borderTop: "1px solid rgba(237, 243, 234, 0.08)",
                color: "#edf3ea",
                fontSize: "0.95rem",
              }}
            >
              <span style={{ fontFamily: "var(--rh-font-mono)", color: "rgba(237, 243, 234, 0.62)" }}>
                {formatTime(lead.created_at)}
              </span>
              <span>
                <strong style={{ display: "block" }}>{lead.caller_name ?? "(no name)"}</strong>
                <span style={{ color: "rgba(237, 243, 234, 0.62)" }}>
                  {lead.service_category}
                  {lowConfidence ? " · review transcript" : ""}
                </span>
              </span>
              <span style={{ color: "rgba(237, 243, 234, 0.7)" }}>{lead.location ?? "—"}</span>
              <span
                style={{
                  alignSelf: "start",
                  background: badge.color,
                  borderRadius: "999px",
                  color: "#fff",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  padding: "0.32rem 0.6rem",
                }}
              >
                {badge.label}
              </span>
              <span style={{ color: "rgba(237, 243, 234, 0.78)" }}>{STATUS_LABEL[lead.status]}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
