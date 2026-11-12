/**
 * /usage — plan usage view (plan U20).
 */
import type { Metadata } from "next";

import { getSupabase } from "../../../lib/supabase/server";

export const metadata: Metadata = { title: "Plan usage | RequestHandoff" };

const TIER_LABEL: Record<string, string> = {
  starter: "Starter ($79)",
  growth: "Growth ($179)",
  pro: "Pro ($349)",
};

export default async function UsagePage() {
  const supabase = await getSupabase();
  const { data: rows } = await supabase
    .from("plan_usage")
    .select("billing_period_start, billing_period_end, plan, included_calls, calls_used")
    .order("billing_period_start", { ascending: false })
    .limit(1);
  const current = rows?.[0];

  if (!current) {
    return (
      <section style={{ maxWidth: "44rem" }}>
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
          Plan usage
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.95 }}>
          Your billing cycle hasn&apos;t started yet.
        </h1>
        <p style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "1.05rem" }}>
          Once your line is forwarding, your call counts will appear here.
        </p>
      </section>
    );
  }

  const pct = Math.min(100, (current.calls_used / current.included_calls) * 100);

  return (
    <section style={{ maxWidth: "44rem" }}>
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
        Plan usage · {TIER_LABEL[current.plan] ?? current.plan}
      </p>
      <h1
        style={{
          fontFamily: "var(--rh-font-mono)",
          fontSize: "clamp(3.4rem, 6vw, 5.6rem)",
          lineHeight: 1,
          marginBottom: "0.6rem",
          color: "#d7b35d",
        }}
      >
        {current.calls_used}
        <span style={{ color: "rgba(237, 243, 234, 0.5)", fontSize: "1.2rem" }}>
          {" "}
          / {current.included_calls} calls
        </span>
      </h1>
      <p style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "0.95rem", marginBottom: "1.4rem" }}>
        {new Date(current.billing_period_start).toLocaleDateString()} →{" "}
        {new Date(current.billing_period_end).toLocaleDateString()}
      </p>
      <div
        style={{
          background: "rgba(237, 243, 234, 0.08)",
          borderRadius: "999px",
          height: "0.6rem",
          marginBottom: "0.8rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: pct > 90 ? "#c0392b" : "#d7b35d",
            height: "100%",
            width: `${pct}%`,
          }}
        />
      </div>
      <p style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "0.88rem" }}>
        Overage at $0.49/call. No escalation fees.
      </p>
    </section>
  );
}
