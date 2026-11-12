import { z } from "zod";

export const CallDirectionSchema = z.enum(["inbound", "demo", "audit"]);
export type CallDirection = z.infer<typeof CallDirectionSchema>;

export const CallStatusSchema = z.enum([
  "in_progress",
  "completed",
  "abandoned",
  "wrap_capped",
  "non_english_fallback",
]);
export type CallStatus = z.infer<typeof CallStatusSchema>;

/**
 * Call record — one row per Retell call (or demo session).
 * Audit calls are forbidden at MVP per founder decision (no outbound prospecting),
 * but the enum carries the value for forward-compat if a v1.1 audit dialer ships.
 */
export const CallRecordSchema = z
  .object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    /** Maps to Retell's `agent_id` — used for tenant resolution per plan U4. */
    retell_agent_id: z.string(),
    /** Retell-issued call id (idempotency key for webhook ingest, U8). */
    retell_call_id: z.string(),

    direction: CallDirectionSchema,
    status: CallStatusSchema,

    started_at: z.string().datetime({ offset: true }),
    ended_at: z.string().datetime({ offset: true }).nullable(),
    duration_seconds: z.number().int().min(0).nullable(),

    /** Transcript may contain PII; same encryption controls as caller_* fields (R25). */
    transcript: z.string().nullable(),
    /** Default 90 days, configurable in v1.1 (R12). */
    transcript_retention_days: z.number().int().default(90),

    /**
     * Per-call COGS telemetry (round 1 finding #11). Tracked from day one to validate
     * the $0.15/call target. Outbound transfer minutes accrue separately for warm-transfers.
     */
    retell_inbound_minutes: z.number().min(0).default(0),
    retell_outbound_transfer_minutes: z.number().min(0).default(0),
    gemini_input_tokens: z.number().int().min(0).default(0),
    gemini_output_tokens: z.number().int().min(0).default(0),
    gemini_cached_tokens: z.number().int().min(0).default(0),
    resend_sends: z.number().int().min(0).default(0),
    created_at: z.string().datetime({ offset: true }),
  })
  .strict();
export type CallRecord = z.infer<typeof CallRecordSchema>;
