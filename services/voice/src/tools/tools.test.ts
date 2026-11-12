import type { TenantConfig, UrgencyRule } from "@requesthandoff/schema";
import { describe, expect, it } from "vitest";

import { checkHours } from "./check-hours.js";
import { checkServiceArea } from "./check-service-area.js";
import { escalateNow } from "./escalate-now.js";
import { requestScheduleWindow } from "./request-schedule-window.js";
import type { ToolContext } from "./types.js";

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
  hours: {
    mon: { open: "08:00", close: "18:00", closed: false },
    tue: { open: "08:00", close: "18:00", closed: false },
    wed: { open: "08:00", close: "18:00", closed: false },
    thu: { open: "08:00", close: "18:00", closed: false },
    fri: { open: "08:00", close: "18:00", closed: false },
    sat: null,
    sun: null,
  },
  services_offered: ["AC repair"],
  services_not_offered: [],
  coverage_zip_codes: ["78664", "78681"],
  custom_urgency_rules: [],
  created_at: "2026-05-04T12:00:00.000Z",
  updated_at: "2026-05-04T12:00:00.000Z",
};

const lifeSafetyRules: UrgencyRule[] = [
  { phrase: "fire", severity: "urgent", is_life_safety: true, description: "Fire" },
  { phrase: "flooding", severity: "urgent", is_life_safety: true, description: "Flooding" },
];

const hvacRules: UrgencyRule[] = [
  ...lifeSafetyRules,
  { phrase: "no cooling vulnerable occupant", severity: "urgent", is_life_safety: false, description: "AC failure with vulnerable occupant" },
  { phrase: "warm air from vents", severity: "elevated", is_life_safety: false, description: "Partial AC failure" },
];

function ctx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    tenant: baseTenant,
    urgencyRules: hvacRules,
    multiStateWarningRequired: false,
    callId: "call_test",
    now: new Date("2026-05-04T15:00:00.000Z"), // Monday 3pm UTC
    ...overrides,
  };
}

describe("checkHours", () => {
  it("returns open during business hours", () => {
    const r = checkHours(ctx());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.is_open).toBe(true);
  });

  it("returns closed on Sunday (day=null)", () => {
    const r = checkHours(ctx({ now: new Date("2026-05-03T15:00:00.000Z") })); // Sunday
    if (r.ok) expect(r.data.is_open).toBe(false);
  });

  it("returns before_open with next_open_at when call lands before open hour", () => {
    const r = checkHours(ctx({ now: new Date("2026-05-04T07:00:00.000Z") })); // Monday 7am
    if (r.ok) {
      expect(r.data.is_open).toBe(false);
      expect(r.data.reason).toBe("before_open");
      expect(r.data.next_open_at).toBe("08:00");
    }
  });

  it("returns after_close past close hour", () => {
    const r = checkHours(ctx({ now: new Date("2026-05-04T19:00:00.000Z") })); // Monday 7pm
    if (r.ok) expect(r.data.reason).toBe("after_close");
  });
});

describe("checkServiceArea", () => {
  it("returns in_area=true for an in-coverage ZIP", () => {
    const r = checkServiceArea(ctx(), { zip_code: "78664" });
    if (r.ok) expect(r.data.in_area).toBe(true);
  });

  it("returns in_area=false for an out-of-coverage ZIP", () => {
    const r = checkServiceArea(ctx(), { zip_code: "10001" });
    if (r.ok) {
      expect(r.data.in_area).toBe(false);
      expect(r.data.reason).toBe("out_of_coverage");
    }
  });

  it("treats empty coverage_zip_codes as no-check", () => {
    const noCoverage: TenantConfig = { ...baseTenant, coverage_zip_codes: [] };
    const r = checkServiceArea(ctx({ tenant: noCoverage }), { zip_code: "10001" });
    if (r.ok) {
      expect(r.data.in_area).toBe(true);
      expect(r.data.reason).toBe("no_coverage_check");
    }
  });

  it("rejects an invalid ZIP code format", () => {
    const r = checkServiceArea(ctx(), { zip_code: "not-a-zip" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error_code).toBe("invalid_zip");
  });

  it("rejects when ZIP is missing and coverage is configured", () => {
    const r = checkServiceArea(ctx(), {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error_code).toBe("missing_zip");
  });
});

describe("requestScheduleWindow", () => {
  it("returns up to 4 windows from open days in the next 7", () => {
    const r = requestScheduleWindow(ctx());
    if (r.ok) {
      expect(r.data.windows.length).toBeGreaterThan(0);
      expect(r.data.windows.length).toBeLessThanOrEqual(4);
    }
  });

  it("skips closed days (sat/sun in the base tenant)", () => {
    // Friday afternoon → next windows should jump to Monday
    const r = requestScheduleWindow(ctx({ now: new Date("2026-05-08T20:00:00.000Z") }));
    if (r.ok) {
      // Saturday + Sunday are closed; the first window should not be on those days.
      const labels = r.data.windows.map((w) => w.label).join(", ");
      expect(labels).not.toContain("Sat");
      expect(labels).not.toContain("Sun");
    }
  });
});

describe("escalateNow", () => {
  it("matches a life-safety phrase and returns urgent escalation (R10, AE2)", () => {
    const r = escalateNow(ctx(), { caller_phrase: "there's a fire in my kitchen" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.should_escalate).toBe(true);
      expect(r.data.rule_id).toBe("life_safety:fire");
      expect(r.data.rule_severity).toBe("urgent");
      expect(r.data.target_phone).toBe(baseTenant.escalation_phone);
    }
  });

  it("matches an HVAC-specific rule with vertical-prefixed rule_id", () => {
    const r = escalateNow(ctx(), { caller_phrase: "I have no cooling vulnerable occupant" });
    if (r.ok) {
      expect(r.data.should_escalate).toBe(true);
      expect(r.data.rule_id).toBe("hvac:no_cooling_vulnerable_occupant");
    }
  });

  it("refuses to escalate when no rule matches (R14, AE3)", () => {
    const r = escalateNow(ctx(), { caller_phrase: "my water bill is way higher than usual" });
    if (r.ok) {
      expect(r.data.should_escalate).toBe(false);
      expect(r.data.rule_id).toBe("no_rule_match");
    }
  });

  it("includes recording-disclosure flag when multi_state_warning_required is true (D11)", () => {
    const r = escalateNow(
      ctx({ multiStateWarningRequired: true }),
      { caller_phrase: "there's a fire" },
    );
    if (r.ok) {
      expect(r.data.recording_disclosure_required).toBe(true);
      expect(r.data.warm_transfer_brief).toContain("recording disclosure required");
    }
  });

  it("returns a retry policy of 2 attempts with exponential backoff", () => {
    const r = escalateNow(ctx(), { caller_phrase: "fire" });
    if (r.ok) {
      expect(r.data.retry_policy.max_attempts).toBe(2);
      expect(r.data.retry_policy.backoff_seconds).toEqual([10, 30]);
    }
  });

  it("rejects an empty caller_phrase", () => {
    const r = escalateNow(ctx(), { caller_phrase: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error_code).toBe("empty_phrase");
  });
});
