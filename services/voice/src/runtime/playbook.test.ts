import type { TenantConfig, VerticalScaffold } from "@requesthandoff/schema";
import { describe, expect, it } from "vitest";

import { composePlaybook } from "./playbook.js";

const generalScaffold: VerticalScaffold = {
  id: "11111111-1111-1111-1111-111111111111",
  vertical: "general",
  name: "General Local Business",
  parent_id: null,
  greeting_prefix: "Hi, this is {{business_name}}.",
  urgency_rules: [
    { phrase: "fire", severity: "urgent", is_life_safety: true, description: "Fire mentioned" },
    { phrase: "flooding", severity: "urgent", is_life_safety: true, description: "Active flooding" },
    { phrase: "medical emergency", severity: "urgent", is_life_safety: true, description: "Medical emergency" },
  ],
  qualification_fields: [
    { key: "caller_name", prompt: "Could I have your name?", required: true, type: "string" },
    { key: "service_category", prompt: "What can we help you with?", required: true, type: "string" },
  ],
  recommended_actions: [
    { id: "callback", condition: "default", action: "callback_request" },
  ],
  created_at: "2026-05-04T12:00:00.000Z",
};

const hvacScaffold: VerticalScaffold = {
  id: "22222222-2222-2222-2222-222222222222",
  vertical: "hvac",
  name: "HVAC",
  parent_id: generalScaffold.id,
  greeting_prefix: "Hi, this is {{business_name}}, your HVAC team.",
  urgency_rules: [
    { phrase: "no cooling vulnerable occupant", severity: "urgent", is_life_safety: false, description: "AC failure with vulnerable occupant" },
    { phrase: "system completely down", severity: "urgent", is_life_safety: false, description: "HVAC down" },
    { phrase: "warm air from vents", severity: "elevated", is_life_safety: false, description: "Partial AC failure" },
  ],
  qualification_fields: [
    { key: "indoor_temperature", prompt: "Indoor temperature?", required: false, type: "string" },
    { key: "system_type", prompt: "Central AC, mini-split, or window unit?", required: false, type: "enum", enum_values: ["central_ac", "mini_split", "window_unit", "unknown"] },
  ],
  recommended_actions: [
    { id: "dispatch_today", condition: "urgent && hours.now == 'open'", action: "dispatch_technician_today" },
    { id: "after_hours_escalate", condition: "urgent && hours.now == 'closed'", action: "warm_transfer_to_owner" },
  ],
  created_at: "2026-05-04T12:00:00.000Z",
};

const baseTenant: TenantConfig = {
  id: "tenant-1",
  business_name: "Austin HVAC Co",
  vertical: "hvac",
  secondary_services: [],
  primary_state: "TX",
  plan: "starter",
  status: "active",
  escalation_phone: "+15125550100",
  escalation_email: "owner@example.com",
  greeting_override: "",
  hours: {},
  services_offered: [],
  services_not_offered: [],
  coverage_zip_codes: [],
  custom_urgency_rules: [],
  created_at: "2026-05-04T12:00:00.000Z",
  updated_at: "2026-05-04T12:00:00.000Z",
};

describe("composePlaybook", () => {
  it("HVAC tenant inherits Life-Safety Baseline + adds HVAC-specific rules", () => {
    const playbook = composePlaybook({
      tenant: baseTenant,
      scaffoldChain: [hvacScaffold, generalScaffold],
    });
    const phrases = playbook.urgency_rules.map((r) => r.phrase);
    expect(phrases).toContain("fire"); // life-safety from General
    expect(phrases).toContain("flooding"); // life-safety from General
    expect(phrases).toContain("no cooling vulnerable occupant"); // HVAC-specific
    expect(phrases).toContain("system completely down"); // HVAC-specific
  });

  it("General-only tenant still inherits Life-Safety Baseline (round 3 ADV-R3-3)", () => {
    const generalTenant: TenantConfig = { ...baseTenant, vertical: "general" };
    const playbook = composePlaybook({
      tenant: generalTenant,
      scaffoldChain: [generalScaffold],
    });
    const phrases = playbook.urgency_rules.map((r) => r.phrase);
    expect(phrases).toContain("fire");
    expect(phrases).toContain("medical emergency");
    // A property-manager-on-General tenant whose customer says "flooding" MUST escalate.
    expect(playbook.urgency_rules.find((r) => r.phrase === "flooding")?.severity).toBe("urgent");
  });

  it("custom rules are appended but cannot weaken life-safety rules (R10)", () => {
    const tenantWithCustom: TenantConfig = {
      ...baseTenant,
      custom_urgency_rules: [
        // attempts to weaken "fire" — should be dropped
        { phrase: "fire", severity: "elevated" },
        // legitimate custom rule — should be kept
        { phrase: "thermostat blank", severity: "elevated", description: "Thermostat display dead" },
      ],
    };
    const playbook = composePlaybook({
      tenant: tenantWithCustom,
      scaffoldChain: [hvacScaffold, generalScaffold],
    });
    const fireRule = playbook.urgency_rules.find((r) => r.phrase === "fire");
    expect(fireRule?.severity).toBe("urgent"); // life-safety preserved
    expect(fireRule?.is_life_safety).toBe(true);
    expect(playbook.urgency_rules.some((r) => r.phrase === "thermostat blank")).toBe(true);
  });

  it("greeting override replaces the scaffold prefix and substitutes business_name", () => {
    const tenant: TenantConfig = {
      ...baseTenant,
      greeting_override: "Howdy, you've reached {{business_name}}, what can we do for you?",
    };
    const playbook = composePlaybook({ tenant, scaffoldChain: [hvacScaffold, generalScaffold] });
    expect(playbook.greeting).toBe("Howdy, you've reached Austin HVAC Co, what can we do for you?");
  });

  it("default greeting uses scaffold prefix + recording disclosure", () => {
    const playbook = composePlaybook({ tenant: baseTenant, scaffoldChain: [hvacScaffold, generalScaffold] });
    expect(playbook.greeting).toContain("Austin HVAC Co");
    expect(playbook.greeting).toContain("recorded");
  });

  it("multi_state_warning_required is true when primary_state is two-party-consent (D11)", () => {
    const caTenant: TenantConfig = { ...baseTenant, primary_state: "CA" };
    const txTenant: TenantConfig = { ...baseTenant, primary_state: "TX" };
    expect(composePlaybook({ tenant: caTenant, scaffoldChain: [hvacScaffold, generalScaffold] }).multi_state_warning_required).toBe(true);
    expect(composePlaybook({ tenant: txTenant, scaffoldChain: [hvacScaffold, generalScaffold] }).multi_state_warning_required).toBe(false);
  });

  it("qualification_fields merge child fields on top of parent fields", () => {
    const playbook = composePlaybook({ tenant: baseTenant, scaffoldChain: [hvacScaffold, generalScaffold] });
    const keys = playbook.qualification_fields.map((f) => f.key);
    expect(keys).toContain("caller_name"); // from General
    expect(keys).toContain("indoor_temperature"); // from HVAC
    expect(keys).toContain("system_type"); // from HVAC
  });

  it("recommended_actions merge from leaf scaffolds (HVAC overrides General defaults)", () => {
    const playbook = composePlaybook({ tenant: baseTenant, scaffoldChain: [hvacScaffold, generalScaffold] });
    const ids = playbook.recommended_actions.map((a) => a.id);
    expect(ids).toContain("callback"); // General default
    expect(ids).toContain("dispatch_today"); // HVAC-specific
    expect(ids).toContain("after_hours_escalate"); // HVAC-specific
  });

  it("supported_languages is English-only at MVP (non-English callers route to fallback)", () => {
    const playbook = composePlaybook({ tenant: baseTenant, scaffoldChain: [hvacScaffold, generalScaffold] });
    expect(playbook.supported_languages).toEqual(["en"]);
  });
});
