import { z } from "zod";

/**
 * Escalation outcome after a warm-transfer-to-owner attempt (R11, R13, AE2).
 * Every escalation produces a row — none silently fail.
 */
export const EscalationOutcomeSchema = z.enum([
  "answered", // owner picked up; bridge succeeded
  "no_answer", // owner ringout
  "declined", // owner declined to take the bridge
  "retell_error", // outbound API error (silent-failure mode per R-A)
  "owner_unreachable", // carrier-side failure (e.g., voicemail full)
  "urgent_unbridged", // escalation gave up; lead delivered with urgent_unbridged flag
]);
export type EscalationOutcome = z.infer<typeof EscalationOutcomeSchema>;

export const EscalationRecordSchema = z
  .object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    call_id: z.string().uuid(),

    /** Which urgency rule fired (e.g., "life_safety:fire", "hvac:no_cooling_vulnerable"). */
    rule_id: z.string(),
    rule_severity: z.enum(["urgent", "elevated"]),

    /** Owner phone the bridge targeted (E.164). */
    target_phone: z.string(),

    attempted_at: z.string().datetime(),
    completed_at: z.string().datetime().nullable(),
    ring_duration_seconds: z.number().int().min(0).nullable(),
    outcome: EscalationOutcomeSchema,

    /**
     * False-positive feedback (round 1 finding #12 — STRATEGY metric #2).
     * Owner clicks "Wasn't actually urgent" in U19 escalation log; sets this flag,
     * which feeds the per-tenant + global precision rate in the founder COGS dashboard.
     */
    owner_marked_false_positive: z.boolean().default(false),
    owner_feedback_at: z.string().datetime().nullable(),

    /** Was the owner's primary state a two-party-consent state at call time? (D11) */
    multi_state_warning_shown: z.boolean().default(false),
  })
  .strict();
export type EscalationRecord = z.infer<typeof EscalationRecordSchema>;
