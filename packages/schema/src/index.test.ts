import { describe, expect, it } from "vitest";

import {
  CONFIDENCE_THRESHOLD,
  DemoConfigSchema,
  REQUIRED_DEMO_SAFETY_BOUNDARIES,
  buildGeneralDemoConfig,
  buildMobileVehicleDemoConfig,
  LeadExtractionSchema,
  TenantConfigSchema,
  UrgencyLevelSchema,
} from "./index.js";

describe("LeadExtractionSchema", () => {
  it("validates a complete extraction", () => {
    const sample = {
      caller_name: "Maria Garcia",
      caller_phone: "+15125550123",
      caller_email: null,
      caller_address: "Round Rock, TX",
      service_category: "AC repair",
      issue_description: "AC stopped working, no cool air for 2 hours",
      location: "78664",
      urgency_level: "urgent",
      urgency_confidence: 0.92,
      preferred_window: "this evening",
      recommended_action: "dispatch_technician",
      recommended_action_confidence: 0.88,
      missing_information: [],
      call_confidence_score: 0.9,
      rule_match_known: true,
    };
    expect(() => LeadExtractionSchema.parse(sample)).not.toThrow();
  });

  it("rejects payload missing urgency_level", () => {
    const sample = {
      caller_name: "Test",
      caller_phone: null,
      caller_email: null,
      caller_address: null,
      service_category: "x",
      issue_description: "y",
      location: null,
      // urgency_level: MISSING
      urgency_confidence: 0.5,
      preferred_window: null,
      recommended_action: "callback",
      recommended_action_confidence: 0.5,
      missing_information: [],
      call_confidence_score: 0.5,
    };
    expect(() => LeadExtractionSchema.parse(sample)).toThrow();
  });

  it("urgency_level enum is exhaustive across {standard, elevated, urgent}", () => {
    const values = UrgencyLevelSchema.options;
    expect(values).toEqual(["standard", "elevated", "urgent"]);
  });

  it("CONFIDENCE_THRESHOLD is at the documented level (0.6)", () => {
    expect(CONFIDENCE_THRESHOLD).toBe(0.6);
  });
});

describe("DemoConfigSchema", () => {
  it("builds a general local-business demo config without vehicle-specific intake", () => {
    const config = buildGeneralDemoConfig({
      businessName: "Demo Fitness Austin",
      websiteUrl: "https://demofitness.example",
      servicesOffered: ["open gym access", "personal training", "gym tours"],
      serviceArea: "Austin, TX",
      correctionNeeded: ["membership options", "best handoff email"],
    });

    expect(config.vertical).toBe("general");
    expect(config.intake_fields).toContain("request_type");
    expect(config.intake_fields).toContain("location_or_service_area");
    expect(config.intake_fields).not.toContain("vehicle_year_make_model");
    expect(config.greeting).toContain("Sorry we could not get to the phone right now");
    expect(config.safety_boundaries).toEqual(REQUIRED_DEMO_SAFETY_BOUNDARIES);
    expect(() => DemoConfigSchema.parse(config)).not.toThrow();
  });

  it("validates a complete mobile vehicle demo config", () => {
    const config = buildMobileVehicleDemoConfig({
      businessName: "Example Auto Glass",
      websiteUrl: "https://autoglass.example/",
      servicesOffered: ["windshield repair", "auto glass replacement"],
      serviceArea: "Austin, Round Rock, Pflugerville",
      correctionNeeded: ["insurance process", "calibration policy"],
    });

    expect(config.intake_fields).toContain("vehicle_year_make_model");
    expect(config.safety_boundaries).toEqual(REQUIRED_DEMO_SAFETY_BOUNDARIES);
    expect(() => DemoConfigSchema.parse(config)).not.toThrow();
  });

  it("rejects configs without required safety boundaries", () => {
    const config = buildMobileVehicleDemoConfig({
      businessName: "ExampleFixers",
      servicesOffered: ["mobile mechanic"],
      serviceArea: "Austin",
    });

    expect(() =>
      DemoConfigSchema.parse({
        ...config,
        safety_boundaries: config.safety_boundaries.filter((item) => item !== "no_diagnosis"),
      }),
    ).toThrow(/no_diagnosis/);
  });

  it("does not expose booking, payment, sms, or crm replacement fields", () => {
    const fieldNames = Object.keys(DemoConfigSchema.shape);
    expect(fieldNames).not.toContain("booking_url");
    expect(fieldNames).not.toContain("payment_url");
    expect(fieldNames).not.toContain("sms_number");
    expect(fieldNames).not.toContain("crm_writeback_enabled");
  });
});

describe("TenantConfigSchema", () => {
  const baseTenant = {
    id: "00000000-0000-0000-0000-000000000001",
    business_name: "Austin HVAC Co",
    vertical: "hvac" as const,
    secondary_services: [],
    primary_state: "TX",
    plan: "starter" as const,
    status: "active" as const,
    escalation_phone: "+15125550100",
    escalation_email: "owner@austinhvac.example",
    greeting_override: "",
    hours: {
      mon: { open: "08:00", close: "18:00", closed: false },
      tue: { open: "08:00", close: "18:00", closed: false },
      wed: { open: "08:00", close: "18:00", closed: false },
      thu: { open: "08:00", close: "18:00", closed: false },
      fri: { open: "08:00", close: "18:00", closed: false },
      sat: null,
      sun: null,
    },
    services_offered: ["AC repair", "heating repair"],
    services_not_offered: [],
    coverage_zip_codes: ["78664", "78681"],
    custom_urgency_rules: [],
    created_at: "2026-05-04T12:00:00.000Z",
    updated_at: "2026-05-04T12:00:00.000Z",
  };

  it("accepts a well-formed HVAC tenant", () => {
    expect(() => TenantConfigSchema.parse(baseTenant)).not.toThrow();
  });

  it("rejects a non-E.164 escalation_phone", () => {
    const bad = { ...baseTenant, escalation_phone: "555-0100" };
    expect(() => TenantConfigSchema.parse(bad)).toThrow();
  });

  it("rejects an invalid state code", () => {
    const bad = { ...baseTenant, primary_state: "Texas" };
    expect(() => TenantConfigSchema.parse(bad)).toThrow();
  });

  it("defaults primary_state to TX for Austin launch (D11)", () => {
    const noState = { ...baseTenant };
    delete (noState as Partial<typeof baseTenant>).primary_state;
    const parsed = TenantConfigSchema.parse(noState);
    expect(parsed.primary_state).toBe("TX");
  });
});
