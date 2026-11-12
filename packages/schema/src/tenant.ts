import { z } from "zod";

/**
 * Vertical scaffold strategy (per plan D14):
 *   - "general": General Local Business (default; gym, salon, lawyer, dentist, etc.).
 *      Inherits the Life-Safety Baseline; no other urgency rules.
 *   - "hvac": HVAC. Inherits General + Life-Safety; adds HVAC-specific urgency rules
 *      (system-down + vulnerable occupant, no cooling in heat, no heat in freeze).
 *   - "plumbing": v1.1 — included here so the type is forward-compatible, but no seed
 *      scaffold ships at MVP. A plumbing operator who signs MVP runs on `general` +
 *      per-tenant urgency rule overrides.
 */
export const VerticalSchema = z.enum(["general", "hvac", "plumbing"]);
export type Vertical = z.infer<typeof VerticalSchema>;

/** Tier names map to Stripe products + plan_usage included_calls. */
export const PlanTierSchema = z.enum(["starter", "growth", "pro"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const TenantStatusSchema = z.enum(["draft", "active", "cancelled", "suspended"]);
export type TenantStatus = z.infer<typeof TenantStatusSchema>;

/**
 * Two-party-consent states (per plan D11 + Kearney v. Salomon Smith Barney precedent).
 * Any owner currently in one of these states triggers a recording-disclosure warning
 * before the dashboard executes a warm-transfer bridge.
 */
export const TWO_PARTY_CONSENT_STATES = [
  "CA",
  "FL",
  "IL",
  "MD",
  "MA",
  "MT",
  "NH",
  "PA",
  "WA",
] as const;
export const TwoPartyConsentStateSchema = z.enum(TWO_PARTY_CONSENT_STATES);
export type TwoPartyConsentState = z.infer<typeof TwoPartyConsentStateSchema>;

/**
 * US state code (2-letter). Default for Austin metro launch is "TX".
 * The owner declares their primary state of operation during onboarding (per plan D11).
 */
export const StateCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/);

/**
 * Tenant config shape. The "live" object that both the hot-path service and the
 * dashboard read against. Most fields are owner-editable in U20 settings; some
 * (id, created_at, plan, vertical) are founder-controlled in admin (U21).
 */
export const TenantConfigSchema = z
  .object({
    id: z.string().uuid(),
    business_name: z.string().min(1).max(200),
    vertical: VerticalSchema,
    /** Comma-separated list of secondary verticals whose urgency rules merge in (D14). */
    secondary_services: z.array(VerticalSchema).default([]),
    /** Owner's primary state of operation. Default TX for Austin launch (D11). */
    primary_state: StateCodeSchema.default("TX"),

    plan: PlanTierSchema,
    status: TenantStatusSchema,

    /** Phone the agent transfers to during urgent escalation (R11, F2). */
    escalation_phone: z.string().regex(/^\+1\d{10}$/, "must be E.164 US number"),
    escalation_email: z.string().email(),

    /** Texas greeting override (D11). Defaults injected at runtime if blank. */
    greeting_override: z.string().max(500).default(""),

    /** Operating hours per weekday — 24-hour HH:MM format. */
    hours: z.record(
      z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
      z
        .object({
          open: z.string().regex(/^\d{2}:\d{2}$/),
          close: z.string().regex(/^\d{2}:\d{2}$/),
          closed: z.boolean().default(false),
        })
        .nullable(),
    ),

    /** Free-form services list — used by the agent for qualification. */
    services_offered: z.array(z.string()).default([]),
    services_not_offered: z.array(z.string()).default([]),

    /** ZIP codes inside the tenant's coverage area. Empty = nationwide / no check. */
    coverage_zip_codes: z.array(z.string().length(5)).default([]),

    /**
     * Generic outbound webhook destination (U14). MVP uses this for Zapier/Make/n8n
     * handoff without making RequestHandoff the system of record.
     */
    outbound_webhook_url: z.string().url().nullable().optional(),
    /**
     * Runtime plaintext HMAC secret for X-RequestHandoff-Signature.
     * Not stored as plaintext in Postgres; post-call decrypts the ciphertext
     * column before validating this schema.
     */
    outbound_webhook_secret: z.string().min(16).nullable().optional(),

    /**
     * Per-tenant urgency rules layered ON TOP of the vertical scaffold's rules
     * + the Life-Safety Baseline. Cannot weaken core scaffold rules per R10.
     */
    custom_urgency_rules: z
      .array(
        z.object({
          phrase: z.string(),
          severity: z.enum(["urgent", "elevated"]),
          description: z.string().optional(),
        }),
      )
      .default([]),

    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .strict();

export type TenantConfig = z.infer<typeof TenantConfigSchema>;
