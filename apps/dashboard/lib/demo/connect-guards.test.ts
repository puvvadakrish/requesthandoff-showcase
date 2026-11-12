import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  extractClientIp,
  hashDemoClientIp,
  isProductionDeployment,
  positiveNumberFromEnv,
  shouldPauseForDemoBudget,
  verifyTurnstileToken,
} from "./connect-guards";

describe("demo connect guards", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("uses the first forwarded IP when present", () => {
    const request = new NextRequest("https://requesthandoff.com/api/demo/test/connect", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 198.51.100.7",
        "cf-connecting-ip": "198.51.100.9",
      },
    });

    expect(extractClientIp(request)).toBe("203.0.113.10");
  });

  it("hashes client IPs with a caller-provided salt", () => {
    const first = hashDemoClientIp("203.0.113.10", "salt-a");
    const second = hashDemoClientIp("203.0.113.10", "salt-a");
    const differentSalt = hashDemoClientIp("203.0.113.10", "salt-b");

    expect(first).toBe(second);
    expect(first).not.toBe("203.0.113.10");
    expect(first).not.toBe(differentSalt);
  });

  it("pauses when projected demo cost reaches the monthly budget", () => {
    expect(
      shouldPauseForDemoBudget({
        monthlyBudgetUsd: 10,
        estimatedSessionCostUsd: 2.5,
        successfulSessionsThisMonth: 4,
      }),
    ).toBe(true);

    expect(
      shouldPauseForDemoBudget({
        monthlyBudgetUsd: 10,
        estimatedSessionCostUsd: 2.5,
        successfulSessionsThisMonth: 3,
      }),
    ).toBe(false);
  });

  it("falls back when numeric env values are missing or invalid", () => {
    process.env.TEST_POSITIVE_NUMBER = "not-a-number";
    expect(positiveNumberFromEnv("TEST_POSITIVE_NUMBER", 12)).toBe(12);

    process.env.TEST_POSITIVE_NUMBER = "3.5";
    expect(positiveNumberFromEnv("TEST_POSITIVE_NUMBER", 12)).toBe(3.5);
  });

  it("does not require Turnstile unless explicitly enabled", async () => {
    process.env.VERCEL_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "";
    const request = new NextRequest("https://requesthandoff.com/api/demo/test/connect");

    expect(isProductionDeployment()).toBe(true);
    await expect(verifyTurnstileToken({ request, token: null })).resolves.toEqual({
      ok: true,
      verified: false,
    });
  });

  it("requires Turnstile configuration when explicitly enabled in production", async () => {
    process.env.DEMO_TURNSTILE_REQUIRED = "true";
    process.env.VERCEL_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "";
    const request = new NextRequest("https://requesthandoff.com/api/demo/test/connect");

    await expect(verifyTurnstileToken({ request, token: null })).resolves.toEqual({
      ok: false,
      error: "turnstile_not_configured",
      status: 503,
    });
  });
});
