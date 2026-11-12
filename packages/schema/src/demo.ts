import { z } from "zod";

export const DemoVerticalSchema = z.enum(["mobile_vehicle", "home_property", "general"]);
export type DemoVertical = z.infer<typeof DemoVerticalSchema>;

export const DemoHandoffDestinationSchema = z.enum(["email", "webhook", "phone_review", "unknown"]);
export type DemoHandoffDestination = z.infer<typeof DemoHandoffDestinationSchema>;

export const DemoSafetyBoundarySchema = z.enum([
  "no_booking",
  "no_calendar_writeback",
  "no_payment",
  "no_sms",
  "no_final_quote",
  "no_diagnosis",
  "no_roadworthiness_advice",
  "no_legal_or_safety_claims",
  "no_crm_or_pos_replacement",
]);
export type DemoSafetyBoundary = z.infer<typeof DemoSafetyBoundarySchema>;

export const REQUIRED_DEMO_SAFETY_BOUNDARIES: DemoSafetyBoundary[] = [
  "no_booking",
  "no_calendar_writeback",
  "no_payment",
  "no_sms",
  "no_final_quote",
  "no_diagnosis",
  "no_roadworthiness_advice",
  "no_legal_or_safety_claims",
  "no_crm_or_pos_replacement",
];

export const DemoIntakeFieldSchema = z.enum([
  "caller_name",
  "callback_number",
  "request_type",
  "vehicle_year_make_model",
  "service_needed",
  "location_or_service_area",
  "vehicle_location",
  "urgency",
  "preferred_window",
  "missing_information",
]);
export type DemoIntakeField = z.infer<typeof DemoIntakeFieldSchema>;

export const DEFAULT_GENERAL_INTAKE_FIELDS: DemoIntakeField[] = [
  "caller_name",
  "callback_number",
  "request_type",
  "service_needed",
  "location_or_service_area",
  "urgency",
  "preferred_window",
  "missing_information",
];

export const DEFAULT_MOBILE_VEHICLE_INTAKE_FIELDS: DemoIntakeField[] = [
  "caller_name",
  "callback_number",
  "vehicle_year_make_model",
  "service_needed",
  "vehicle_location",
  "urgency",
  "preferred_window",
  "missing_information",
];

export const DemoConfigSchema = z
  .object({
    business_name: z.string().min(1).max(200),
    vertical: DemoVerticalSchema.default("general"),
    website_url: z.string().url().nullable().default(null),
    brand_logo_url: z.string().url().nullable().default(null),
    gbp_url: z.string().url().nullable().default(null),
    greeting: z.string().min(1).max(500),
    services_offered: z.array(z.string().min(1)).min(1),
    services_not_offered: z.array(z.string().min(1)).default([]),
    service_area: z.string().min(1).max(500),
    hours_summary: z.string().max(500).default("Correction needed"),
    intake_fields: z.array(DemoIntakeFieldSchema).min(5),
    urgency_rules: z.array(z.string().min(1)).default([]),
    handoff_destination: DemoHandoffDestinationSchema.default("email"),
    correction_needed: z.array(z.string().min(1)).default([]),
    safety_boundaries: z.array(DemoSafetyBoundarySchema).superRefine((values, ctx) => {
      for (const required of REQUIRED_DEMO_SAFETY_BOUNDARIES) {
        if (!values.includes(required)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `missing required safety boundary: ${required}`,
          });
        }
      }
    }),
    notes: z.string().max(1000).default(""),
    provider: z
      .object({
        name: z.enum(["retell", "video", "manual"]).default("retell"),
        demo_agent_id: z.string().nullable().default(null),
      })
      .default({ name: "retell", demo_agent_id: null }),
  })
  .strict();

export type DemoConfig = z.infer<typeof DemoConfigSchema>;

interface DemoConfigBuilderInput {
  businessName: string;
  websiteUrl?: string | null;
  brandLogoUrl?: string | null;
  gbpUrl?: string | null;
  servicesOffered: string[];
  servicesNotOffered?: string[];
  serviceArea: string;
  hoursSummary?: string;
  correctionNeeded?: string[];
  handoffDestination?: DemoHandoffDestination;
  notes?: string;
}

export function buildGeneralDemoConfig(input: DemoConfigBuilderInput): DemoConfig {
  return DemoConfigSchema.parse({
    business_name: input.businessName,
    vertical: "general",
    website_url: input.websiteUrl ?? null,
    brand_logo_url: input.brandLogoUrl ?? null,
    gbp_url: input.gbpUrl ?? null,
    greeting: `Thanks for calling ${input.businessName}. Sorry we could not get to the phone right now. I can take down what you need and pass it to the team. For quality, this call may be recorded. What can I help you with today?`,
    services_offered: input.servicesOffered,
    services_not_offered: input.servicesNotOffered ?? [],
    service_area: input.serviceArea,
    hours_summary: input.hoursSummary ?? "Correction needed",
    intake_fields: DEFAULT_GENERAL_INTAKE_FIELDS,
    urgency_rules: [
      "Capture whether the caller needs same-day follow-up, a scheduled callback, or owner review.",
      "Do not promise booking, pricing, payment, or policy decisions; mark unclear details for owner review.",
    ],
    handoff_destination: input.handoffDestination ?? "email",
    correction_needed: input.correctionNeeded ?? [],
    safety_boundaries: REQUIRED_DEMO_SAFETY_BOUNDARIES,
    notes: input.notes ?? "",
    provider: { name: "retell", demo_agent_id: null },
  });
}

export function buildMobileVehicleDemoConfig(input: DemoConfigBuilderInput): DemoConfig {
  return DemoConfigSchema.parse({
    business_name: input.businessName,
    vertical: "mobile_vehicle",
    website_url: input.websiteUrl ?? null,
    brand_logo_url: input.brandLogoUrl ?? null,
    gbp_url: input.gbpUrl ?? null,
    greeting: `Thanks for calling ${input.businessName}. Sorry we could not get to the phone right now. I can take a few details and get them to the shop. For quality, this call may be recorded. What is going on with the vehicle?`,
    services_offered: input.servicesOffered,
    services_not_offered: input.servicesNotOffered ?? [],
    service_area: input.serviceArea,
    hours_summary: input.hoursSummary ?? "Correction needed",
    intake_fields: DEFAULT_MOBILE_VEHICLE_INTAKE_FIELDS,
    urgency_rules: [
      "Disabled vehicle or same-day need gets an urgent callback flag.",
      "Broken windshield, unsafe damage report, or stranded caller gets urgent owner review.",
    ],
    handoff_destination: input.handoffDestination ?? "email",
    correction_needed: input.correctionNeeded ?? [],
    safety_boundaries: REQUIRED_DEMO_SAFETY_BOUNDARIES,
    notes: input.notes ?? "",
    provider: { name: "retell", demo_agent_id: null },
  });
}
