import { describe, expect, it, vi } from "vitest";

import { runEscalation, type EscalationStorage, type RetellOutbound } from "./escalation.js";

function makeStorage(): EscalationStorage {
  let counter = 0;
  return {
    insertAttempt: vi.fn().mockImplementation(async () => ({ id: `esc_${++counter}` })),
    recordOutcome: vi.fn().mockResolvedValue(undefined),
  };
}

const baseArgs = {
  tenantId: "tenant-1",
  callId: "call-1",
  ruleId: "life_safety:fire",
  ruleSeverity: "urgent" as const,
  targetPhone: "+15125550100",
  warmTransferBrief: "urgent call: kitchen fire",
  recordingDisclosureRequired: false,
  multiStateWarningShown: false,
  sleepFn: async () => {},
};

describe("runEscalation", () => {
  it("returns answered on first-attempt pickup", async () => {
    const storage = makeStorage();
    const retell: RetellOutbound = {
      placeBridge: vi.fn().mockResolvedValue({ outcome: "answered", ring_duration_seconds: 9 }),
    };
    const result = await runEscalation({ ...baseArgs, storage, retell });
    expect(result.outcome).toBe("answered");
    expect(result.attempts).toBe(1);
    expect(result.bridged).toBe(true);
    expect(storage.insertAttempt).toHaveBeenCalledTimes(1);
    expect(storage.recordOutcome).toHaveBeenCalledTimes(1);
  });

  it("retries on no-answer and succeeds on second attempt", async () => {
    const storage = makeStorage();
    const retell: RetellOutbound = {
      placeBridge: vi
        .fn()
        .mockResolvedValueOnce({ outcome: "no_answer", ring_duration_seconds: 30 })
        .mockResolvedValueOnce({ outcome: "answered", ring_duration_seconds: 6 }),
    };
    const result = await runEscalation({ ...baseArgs, storage, retell });
    expect(result.outcome).toBe("answered");
    expect(result.attempts).toBe(2);
    expect(storage.insertAttempt).toHaveBeenCalledTimes(2);
  });

  it("returns urgent_unbridged after exhausting all attempts", async () => {
    const storage = makeStorage();
    const retell: RetellOutbound = {
      placeBridge: vi.fn().mockResolvedValue({ outcome: "no_answer", ring_duration_seconds: 30 }),
    };
    const result = await runEscalation({ ...baseArgs, storage, retell, maxAttempts: 2 });
    expect(result.outcome).toBe("urgent_unbridged");
    expect(result.attempts).toBe(2);
    expect(result.bridged).toBe(false);
  });

  it("does not retry when owner declines", async () => {
    const storage = makeStorage();
    const retell: RetellOutbound = {
      placeBridge: vi.fn().mockResolvedValue({ outcome: "declined", ring_duration_seconds: 2 }),
    };
    const result = await runEscalation({ ...baseArgs, storage, retell, maxAttempts: 2 });
    expect(result.outcome).toBe("declined");
    expect(result.attempts).toBe(1);
    expect(retell.placeBridge).toHaveBeenCalledTimes(1);
  });

  it("records retell_error and continues to retry on Retell API failure (silent-failure guard)", async () => {
    const storage = makeStorage();
    const retell: RetellOutbound = {
      placeBridge: vi
        .fn()
        .mockRejectedValueOnce(new Error("Retell 5xx"))
        .mockResolvedValueOnce({ outcome: "answered", ring_duration_seconds: 8 }),
    };
    const result = await runEscalation({ ...baseArgs, storage, retell });
    expect(result.outcome).toBe("answered");
    expect(result.attempts).toBe(2);
    expect(storage.recordOutcome).toHaveBeenNthCalledWith(1, {
      id: expect.any(String),
      outcome: "retell_error",
      ring_duration_seconds: null,
    });
  });

  it("logs an audit row BEFORE the outbound call (no silent failures, R13)", async () => {
    const storage = makeStorage();
    const calls: string[] = [];
    storage.insertAttempt = vi.fn().mockImplementation(async () => {
      calls.push("insert");
      return { id: "esc_1" };
    });
    const retell: RetellOutbound = {
      placeBridge: vi.fn().mockImplementation(async () => {
        calls.push("bridge");
        return { outcome: "answered", ring_duration_seconds: 7 };
      }),
    };
    await runEscalation({ ...baseArgs, storage, retell });
    expect(calls).toEqual(["insert", "bridge"]);
  });
});
