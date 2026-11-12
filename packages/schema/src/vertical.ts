import { z } from "zod";

import { VerticalSchema } from "./tenant.js";

/**
 * A scaffold defines the per-vertical playbook: greeting prefix, intake fields,
 * urgency rules, and recommended-action heuristics. Composed with per-tenant
 * overrides at call setup (U9 playbook composition).
 *
 * Inheritance (D14):
 *   - parent_id: NULL → root scaffold
 *   - parent_id: <general.id> → HVAC inherits General intake + Life-Safety
 *   - parent_id: <general.id> → future plumbing inherits the same chain
 *
 * Life-Safety Baseline (round 3 ADV-R3-3): General scaffold's `urgency_rules`
 * includes life-safety phrases (fire, flooding, sparks, gas, medical) so EVERY
 * tenant — including a property manager whose tenant calls about flooding —
 * has an escalation path. Without this, General-scaffold-with-no-escalation
 * is dangerous-by-default.
 */
export const UrgencyRuleSchema = z
  .object({
    phrase: z.string(),
    severity: z.enum(["urgent", "elevated"]),
    description: z.string().optional(),
    /** Marks rules contributed by the Life-Safety Baseline so they can't be disabled. */
    is_life_safety: z.boolean().default(false),
  })
  .strict();
export type UrgencyRule = z.infer<typeof UrgencyRuleSchema>;

export const QualificationFieldSchema = z
  .object({
    key: z.string(),
    prompt: z.string(),
    required: z.boolean().default(false),
    /** "string" | "number" | "boolean" | "enum" — agent receives this as a typed slot. */
    type: z.enum(["string", "number", "boolean", "enum"]),
    enum_values: z.array(z.string()).optional(),
  })
  .strict();
export type QualificationField = z.infer<typeof QualificationFieldSchema>;

export const VerticalScaffoldSchema = z
  .object({
    id: z.string().uuid(),
    vertical: VerticalSchema,
    name: z.string(),
    parent_id: z.string().uuid().nullable(),

    /** Greeting prefix injected before the recording disclosure (D11). */
    greeting_prefix: z.string().default(""),

    /** Urgency rules contributed by THIS scaffold (resolved/merged at call setup). */
    urgency_rules: z.array(UrgencyRuleSchema).default([]),

    /** Qualification fields the agent collects during intake. */
    qualification_fields: z.array(QualificationFieldSchema).default([]),

    /**
     * Recommended action heuristics — the agent picks one based on extracted fields,
     * surfaced as `recommended_action` in the lead schema.
     */
    recommended_actions: z
      .array(
        z
          .object({
            id: z.string(),
            condition: z.string(),
            action: z.string(),
          })
          .strict(),
      )
      .default([]),

    created_at: z.string().datetime(),
  })
  .strict();
export type VerticalScaffold = z.infer<typeof VerticalScaffoldSchema>;
