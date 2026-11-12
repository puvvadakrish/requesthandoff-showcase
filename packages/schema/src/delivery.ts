import { z } from "zod";

/** Integration handlers in the post-call delivery fan-out (R16). */
export const DeliveryChannelSchema = z.enum([
  "email", // always-on baseline (R17)
  "jobber", // Week 5 build (R18)
  "webhook_url", // Week 6 build — generic outbound webhook URL (replaces native Zapier app at MVP)
]);
export type DeliveryChannel = z.infer<typeof DeliveryChannelSchema>;

export const DeliveryStatusSchema = z.enum([
  "pending",
  "delivered",
  "failed",
  "retrying",
  "needs_reauth", // OAuth token expired (Jobber 401)
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

export const DeliveryRecordSchema = z
  .object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    lead_id: z.string().uuid(),
    channel: DeliveryChannelSchema,
    status: DeliveryStatusSchema,
    attempt_count: z.number().int().min(0).default(0),
    last_attempt_at: z.string().datetime().nullable(),
    next_attempt_at: z.string().datetime().nullable(),
    error_message: z.string().nullable(),
    /** Provider-specific receipt/id (e.g., Jobber Request id, Resend message id). */
    provider_id: z.string().nullable(),
    created_at: z.string().datetime(),
  })
  .strict();
export type DeliveryRecord = z.infer<typeof DeliveryRecordSchema>;
