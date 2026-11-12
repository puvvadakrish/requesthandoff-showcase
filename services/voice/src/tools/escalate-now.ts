/**
 * escalate_now — the agent invokes this mid-call when an urgency rule fires (R10, R11, R14, AE2, AE3).
 *
 * Hard rules:
 *   - Refuse to escalate if no urgency rule matches the caller's stated phrase
 *     (R14 — system never invents an emergency).
 *   - When the tenant's primary state is two-party-consent, return a
 *     recording-disclosure prompt the agent must read before bridging (D11).
 *   - Never weaken life-safety rules; per-tenant disable does NOT apply to
 *     life-safety phrases (R10, enforced at composition time in playbook.ts).
 */
import { fail, ok, type ToolContext, type ToolResponse } from "./types.js";

export interface EscalateNowArgs {
  /** The phrase or topic the caller said that the agent thinks is urgent. */
  caller_phrase: string;
}

export interface EscalateNowResult {
  should_escalate: boolean;
  rule_id: string;
  rule_severity: "urgent" | "elevated";
  rule_phrase: string;
  /** E.164 owner phone the agent will warm-transfer to. */
  target_phone: string;
  /** What the agent should brief the owner with on bridge pickup. */
  warm_transfer_brief: string;
  /** Required only when multi-state warning fires (D11). */
  recording_disclosure_required: boolean;
  /** Retry policy if owner doesn't answer (R11). */
  retry_policy: {
    max_attempts: number;
    backoff_seconds: number[];
  };
}

const NO_RULE_MATCH = "no_rule_match";

export function escalateNow(ctx: ToolContext, args: EscalateNowArgs): ToolResponse<EscalateNowResult> {
  const startedAt = Date.now();
  const phrase = args.caller_phrase.trim().toLowerCase();
  if (phrase === "") {
    return fail("empty_phrase", "caller_phrase is required", startedAt);
  }

  const matched = ctx.urgencyRules.find((rule) => phrase.includes(rule.phrase.toLowerCase()));
  if (!matched) {
    // R14, AE3: refuse to escalate when no rule matches. The agent should treat the
    // call as standard-priority and capture the lead via the normal intake flow.
    return ok(
      {
        should_escalate: false,
        rule_id: NO_RULE_MATCH,
        rule_severity: "elevated",
        rule_phrase: phrase,
        target_phone: "",
        warm_transfer_brief: "",
        recording_disclosure_required: false,
        retry_policy: { max_attempts: 0, backoff_seconds: [] },
      },
      startedAt,
    );
  }

  const ruleId = matched.is_life_safety
    ? `life_safety:${matched.phrase.replace(/\s+/g, "_")}`
    : `${ctx.tenant.vertical}:${matched.phrase.replace(/\s+/g, "_")}`;

  const severityLabel = matched.severity === "urgent" ? "urgent" : "elevated";
  const briefSubject = matched.description ?? matched.phrase;
  const stateNote = ctx.multiStateWarningRequired
    ? " (NOTE: recording disclosure required before bridge — owner is in a two-party-consent state)"
    : "";

  return ok(
    {
      should_escalate: true,
      rule_id: ruleId,
      rule_severity: matched.severity,
      rule_phrase: matched.phrase,
      target_phone: ctx.tenant.escalation_phone,
      warm_transfer_brief: `${severityLabel} call from a customer: ${briefSubject}${stateNote}`,
      recording_disclosure_required: ctx.multiStateWarningRequired,
      retry_policy: { max_attempts: 2, backoff_seconds: [10, 30] },
    },
    startedAt,
  );
}
