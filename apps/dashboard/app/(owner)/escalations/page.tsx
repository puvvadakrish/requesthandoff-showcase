/**
 * /escalations — escalation log + "wasn't actually urgent" feedback button
 * (plan U19 + round 1 finding #12 — STRATEGY metric #2 false-positive precision).
 */
import type { Metadata } from "next";

import { getSupabase } from "../../../lib/supabase/server";
import { markFalsePositive } from "./actions";

export const metadata: Metadata = { title: "Escalations | RequestHandoff" };

interface EscRow {
  id: string;
  rule_id: string;
  rule_severity: "urgent" | "elevated";
  target_phone: string;
  attempted_at: string;
  ring_duration_seconds: number | null;
  outcome: string;
  owner_marked_false_positive: boolean;
  multi_state_warning_shown: boolean;
}

const OUTCOME_LABEL: Record<string, string> = {
  answered: "Answered",
  no_answer: "No answer",
  declined: "Declined",
  retell_error: "Telecom error",
  owner_unreachable: "Unreachable",
  urgent_unbridged: "Urgent · unbridged",
};

async function load(): Promise<EscRow[]> {
  const supabase = await getSupabase();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("escalations")
    .select(
      "id, rule_id, rule_severity, target_phone, attempted_at, ring_duration_seconds, outcome, owner_marked_false_positive, multi_state_warning_shown",
    )
    .gte("attempted_at", since)
    .order("attempted_at", { ascending: false });
  return (data ?? []) as EscRow[];
}

export default async function EscalationsPage() {
  const rows = await load();

  if (rows.length === 0) {
    return (
      <section style={{ maxWidth: "48rem" }}>
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
          Escalations · last 30 days
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.95, marginBottom: "1rem" }}>
          No escalations yet.
        </h1>
        <p style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "1.05rem", maxWidth: "40rem" }}>
          When the agent fires an urgency rule from your playbook, the bridge attempt and outcome
          land here. Mark any escalation as &quot;wasn&apos;t actually urgent&quot; to tighten
          your rules.
        </p>
      </section>
    );
  }

  return (
    <section>
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
        Escalations · last 30 days
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", lineHeight: 0.95, marginBottom: "1.6rem" }}>
        {rows.length} attempt{rows.length === 1 ? "" : "s"}
      </h1>

      <div
        style={{
          background: "rgba(237, 243, 234, 0.04)",
          border: "1px solid rgba(237, 243, 234, 0.12)",
          borderRadius: "var(--rh-radius-sm)",
          overflow: "hidden",
        }}
      >
        {rows.map((row) => (
          <div
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: "10rem 1fr 7rem 7rem 11rem",
              gap: "1rem",
              padding: "1rem 1.2rem",
              borderTop: "1px solid rgba(237, 243, 234, 0.08)",
              alignItems: "center",
            }}
          >
            <span style={{ fontFamily: "var(--rh-font-mono)", color: "rgba(237, 243, 234, 0.62)" }}>
              {new Date(row.attempted_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            <span>
              <strong style={{ display: "block" }}>{row.rule_id}</strong>
              <span style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "0.88rem" }}>
                → {row.target_phone}
                {row.multi_state_warning_shown ? " · multi-state warning" : ""}
              </span>
            </span>
            <span style={{ fontFamily: "var(--rh-font-mono)", color: "rgba(237, 243, 234, 0.7)" }}>
              {row.ring_duration_seconds ? `${row.ring_duration_seconds}s` : "—"}
            </span>
            <span style={{ color: "rgba(237, 243, 234, 0.85)" }}>
              {OUTCOME_LABEL[row.outcome] ?? row.outcome}
            </span>
            {row.owner_marked_false_positive ? (
              <span
                style={{
                  color: "rgba(237, 243, 234, 0.62)",
                  fontSize: "0.84rem",
                  fontStyle: "italic",
                }}
              >
                Marked false positive
              </span>
            ) : (
              <form action={markFalsePositive}>
                <input type="hidden" name="escalation_id" value={row.id} />
                <button
                  type="submit"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(237, 243, 234, 0.2)",
                    borderRadius: "999px",
                    color: "#edf3ea",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    padding: "0.4rem 0.7rem",
                  }}
                >
                  Wasn&apos;t actually urgent
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
