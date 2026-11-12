/**
 * /leads/[leadId] — owner lead detail (plan U19 + D16).
 *
 * Structured fields prominent (CLAUDE.md positioning rule #8).
 * Transcript collapsible. Confidence-score badge surfaces "review transcript"
 * prompt when overall confidence < 0.6 (round 1 DESIGN-002).
 * Self-attribution UI: status select + dollar value when status=booked
 * (round 1 DESIGN-006).
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadRecordSchema } from "@requesthandoff/schema";

import { getSupabase } from "../../../../lib/supabase/server";
import { updateLeadStatus, type StatusInput } from "./actions";

interface PageProps {
  params: Promise<{ leadId: string }>;
}

const STATUS_OPTIONS: StatusInput[] = ["new", "contacted", "booked", "lost", "spam"];

export default async function LeadDetailPage({ params }: PageProps) {
  const { leadId } = await params;
  const supabase = await getSupabase();
  const { data: leadRow } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!leadRow) {
    notFound();
  }
  const lead = LeadRecordSchema.parse(leadRow);
  const lowConfidence = lead.call_confidence_score < 0.6;

  const { data: callRow } = await supabase
    .from("calls")
    .select("transcript, started_at, ended_at, duration_seconds")
    .eq("id", lead.call_id)
    .maybeSingle();

  return (
    <article style={{ maxWidth: "60rem" }}>
      <Link
        href="/leads"
        style={{
          color: "rgba(237, 243, 234, 0.62)",
          fontSize: "0.88rem",
          textDecoration: "none",
        }}
      >
        ← All leads
      </Link>

      <header style={{ marginTop: "1rem", marginBottom: "1.6rem" }}>
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
          Captured lead · {lead.urgency_level.toUpperCase()}
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", lineHeight: 1, marginBottom: "0.6rem" }}>
          {lead.service_category}
        </h1>
        <p style={{ color: "rgba(237, 243, 234, 0.7)", fontSize: "1.05rem" }}>
          {lead.issue_description}
        </p>
      </header>

      {lowConfidence ? (
        <div
          style={{
            background: "rgba(216, 173, 99, 0.16)",
            border: "1px solid rgba(216, 173, 99, 0.4)",
            borderRadius: "var(--rh-radius-sm)",
            color: "#f7e9c4",
            padding: "0.9rem 1.1rem",
            marginBottom: "1.6rem",
          }}
        >
          <strong>Agent may have missed details.</strong> Overall confidence is{" "}
          {(lead.call_confidence_score * 100).toFixed(0)}%. Review the transcript below before
          calling back.
        </div>
      ) : null}

      <section
        style={{
          background: "rgba(237, 243, 234, 0.04)",
          border: "1px solid rgba(237, 243, 234, 0.12)",
          borderRadius: "var(--rh-radius-sm)",
          padding: "1.4rem",
          marginBottom: "1.6rem",
        }}
      >
        <dl style={{ display: "grid", gridTemplateColumns: "10rem 1fr", gap: "0.8rem 1.4rem", margin: 0 }}>
          <Field label="Caller">{lead.caller_name ?? "(not captured)"}</Field>
          <Field label="Phone">{lead.caller_phone ?? "(not captured)"}</Field>
          <Field label="Email">{lead.caller_email ?? "(not captured)"}</Field>
          <Field label="Address">{lead.caller_address ?? "(not captured)"}</Field>
          <Field label="Location">{lead.location ?? "(not captured)"}</Field>
          <Field label="Preferred window">{lead.preferred_window ?? "(not specified)"}</Field>
          <Field label="Recommended">
            {lead.recommended_action} ({(lead.recommended_action_confidence * 100).toFixed(0)}%
            confidence)
          </Field>
          {lead.missing_information.length > 0 ? (
            <Field label="Missing fields">{lead.missing_information.join(", ")}</Field>
          ) : null}
        </dl>
      </section>

      <section
        style={{
          background: "rgba(237, 243, 234, 0.04)",
          border: "1px solid rgba(237, 243, 234, 0.12)",
          borderRadius: "var(--rh-radius-sm)",
          padding: "1.4rem",
          marginBottom: "1.6rem",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.8rem" }}>Mark outcome</h2>
        <p style={{ color: "rgba(237, 243, 234, 0.7)", fontSize: "0.92rem", marginBottom: "1rem" }}>
          Marking &quot;Booked&quot; with a dollar value adds this lead to your weekly ROI report.
        </p>
        <form action={updateLeadStatus}>
          <input type="hidden" name="lead_id" value={lead.id} />
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.8rem",
                  border: "1px solid rgba(237, 243, 234, 0.16)",
                  borderRadius: "999px",
                  cursor: "pointer",
                  background: option === lead.status ? "rgba(216, 173, 99, 0.16)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="status"
                  value={option}
                  defaultChecked={option === lead.status}
                />
                <span>{option}</span>
              </label>
            ))}
            <input
              type="number"
              name="attributed_value_usd"
              placeholder="Job $ (only when booked)"
              min={0}
              step={1}
              defaultValue={lead.attributed_value_usd ?? ""}
              style={{
                width: "12rem",
                padding: "0.55rem 0.8rem",
                border: "1px solid rgba(237, 243, 234, 0.2)",
                borderRadius: "var(--rh-radius-sm)",
                background: "rgba(0, 0, 0, 0.24)",
                color: "#edf3ea",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0.55rem 0.95rem",
                background: "#d7b35d",
                color: "#0f1413",
                border: "none",
                borderRadius: "999px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Save outcome
            </button>
          </div>
        </form>
      </section>

      {callRow?.transcript ? (
        <details
          style={{
            background: "rgba(237, 243, 234, 0.04)",
            border: "1px solid rgba(237, 243, 234, 0.12)",
            borderRadius: "var(--rh-radius-sm)",
            padding: "1.2rem 1.4rem",
          }}
          open={lowConfidence}
        >
          <summary
            style={{
              cursor: "pointer",
              fontWeight: 800,
              color: "#edf3ea",
            }}
          >
            Transcript · {callRow.duration_seconds ?? "?"}s
          </summary>
          <pre
            style={{
              fontFamily: "var(--rh-font-mono)",
              fontSize: "0.88rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              color: "rgba(237, 243, 234, 0.85)",
              marginTop: "1rem",
            }}
          >
            {callRow.transcript}
          </pre>
        </details>
      ) : null}
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "0.84rem", fontWeight: 600 }}>
        {label}
      </dt>
      <dd style={{ margin: 0, color: "#edf3ea" }}>{children}</dd>
    </>
  );
}
