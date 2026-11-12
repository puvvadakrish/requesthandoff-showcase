import { z } from "zod";

/**
 * Lead extraction schema (per plan R15 + Vertex AI Gemini 3 Flash `responseSchema`).
 * Used as both the runtime validator AND Gemini's enforced output structure.
 * Pinned model: `gemini-3-flash-preview`.
 *
 * Per round 1 finding #13: every judgment field carries a confidence score so
 * the dashboard can surface "agent may have missed details" prompts (U19) when
 * confidence is below threshold.
 */
export const UrgencyLevelSchema = z.enum(["standard", "elevated", "urgent"]);
export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>;

export const LeadStatusSchema = z.enum(["new", "contacted", "booked", "lost", "spam"]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

/** A field-level confidence score in [0, 1]; below 0.6 surfaces a yellow flag in U19. */
export const ConfidenceSchema = z.number().min(0).max(1);
export const CONFIDENCE_THRESHOLD = 0.6;

export const LeadExtractionSchema = z
  .object({
    /** Caller details — encrypted at rest in Supabase Vault per R25. */
    caller_name: z.string().nullable(),
    caller_phone: z.string().nullable(),
    caller_email: z.string().nullable(),
    caller_address: z.string().nullable(),

    /** Service category — what the caller is asking for (e.g., "AC repair"). */
    service_category: z.string(),

    /** Free-form issue description as the caller stated it. */
    issue_description: z.string(),

    /** Best-effort location (ZIP, neighborhood, or city) extracted from the call. */
    location: z.string().nullable(),

    /** Triage decision (R10/R11 — life-safety baseline OR vertical-specific OR per-tenant). */
    urgency_level: UrgencyLevelSchema,
    urgency_confidence: ConfidenceSchema,

    /** Caller's preferred appointment window, if offered. */
    preferred_window: z.string().nullable(),

    /** Recommended next action picked from the scaffold's `recommended_actions`. */
    recommended_action: z.string(),
    recommended_action_confidence: ConfidenceSchema,

    /** Fields the agent didn't get — surfaces as red badges in U22 + U19. */
    missing_information: z.array(z.string()).default([]),

    /** Overall confidence in the structured extraction (drives U19 review prompt). */
    call_confidence_score: ConfidenceSchema,

    /** True when the agent's playbook includes the urgency rule that fired (per AE3). */
    rule_match_known: z.boolean().default(false),

    /**
     * Set ONLY when language detection fired the non-English fallback path (U9):
     * "es" for Spanish, etc. Lead is logged with raw audio attached; no extraction
     * is attempted on a non-English transcript at MVP.
     */
    detected_language: z.string().length(2).nullable().optional(),
  })
  .strict();

export type LeadExtraction = z.infer<typeof LeadExtractionSchema>;

/**
 * Lead row as stored in Postgres (extends extraction with persistence + workflow fields).
 */
export const LeadRecordSchema = LeadExtractionSchema.extend({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  call_id: z.string().uuid(),
  status: LeadStatusSchema.default("new"),
  /** Owner-self-attributed dollar value when status = booked (R21, U19). */
  attributed_value_usd: z.number().min(0).nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
}).strict();
export type LeadRecord = z.infer<typeof LeadRecordSchema>;
