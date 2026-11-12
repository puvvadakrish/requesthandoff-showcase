/**
 * Escalation logging + outbound retry (plan U15, R11, R13, AE2).
 *
 * Every escalation produces an audit row before Retell places the outbound call.
 * On no-answer, retry with exponential backoff (max 2 attempts per round 1
 * decision; the agent's escalate_now retry_policy returned [10, 30] seconds).
 *
 * If both attempts ring out, the call is marked `urgent_unbridged` and the
 * lead summary email gets a flag the dashboard renders prominently. No
 * silent failures (R13).
 */
import type { EscalationOutcome } from "@requesthandoff/schema";
import { logger } from "../observability/logger.js";

export interface EscalationStorage {
  insertAttempt(args: {
    tenant_id: string;
    call_id: string;
    rule_id: string;
    rule_severity: "urgent" | "elevated";
    target_phone: string;
    multi_state_warning_shown: boolean;
  }): Promise<{ id: string }>;
  recordOutcome(args: {
    id: string;
    outcome: EscalationOutcome;
    ring_duration_seconds: number | null;
  }): Promise<void>;
}

export interface RetellOutbound {
  placeBridge(args: {
    target_phone: string;
    warm_transfer_brief: string;
    recording_disclosure_required: boolean;
  }): Promise<{
    outcome: "answered" | "no_answer" | "declined" | "owner_unreachable" | "retell_error";
    ring_duration_seconds: number | null;
  }>;
}

interface RunArgs {
  storage: EscalationStorage;
  retell: RetellOutbound;
  tenantId: string;
  callId: string;
  ruleId: string;
  ruleSeverity: "urgent" | "elevated";
  targetPhone: string;
  warmTransferBrief: string;
  recordingDisclosureRequired: boolean;
  multiStateWarningShown: boolean;
  /** Number of bridge attempts to make before giving up. Default 2 (per escalate_now retry_policy). */
  maxAttempts?: number;
  /** Backoff between attempts in seconds. */
  backoffSeconds?: number[];
  sleepFn?: (seconds: number) => Promise<void>;
}

export interface RunResult {
  outcome: EscalationOutcome;
  attempts: number;
  bridged: boolean;
}

export async function runEscalation({
  storage,
  retell,
  tenantId,
  callId,
  ruleId,
  ruleSeverity,
  targetPhone,
  warmTransferBrief,
  recordingDisclosureRequired,
  multiStateWarningShown,
  maxAttempts = 2,
  backoffSeconds = [10, 30],
  sleepFn = (s) => new Promise((r) => setTimeout(r, s * 1000)),
}: RunArgs): Promise<RunResult> {
  let attempts = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;

    // Insert audit row BEFORE the outbound call so the attempt is logged even
    // if the call itself errors mid-flight (R13 — no escalation may silently fail).
    const { id } = await storage.insertAttempt({
      tenant_id: tenantId,
      call_id: callId,
      rule_id: ruleId,
      rule_severity: ruleSeverity,
      target_phone: targetPhone,
      multi_state_warning_shown: multiStateWarningShown,
    });

    try {
      const result = await retell.placeBridge({
        target_phone: targetPhone,
        warm_transfer_brief: warmTransferBrief,
        recording_disclosure_required: recordingDisclosureRequired,
      });
      await storage.recordOutcome({
        id,
        outcome: result.outcome,
        ring_duration_seconds: result.ring_duration_seconds,
      });

      if (result.outcome === "answered") {
        return { outcome: "answered", attempts, bridged: true };
      }
      // declined → don't retry; owner explicitly rejected
      if (result.outcome === "declined") {
        return { outcome: "declined", attempts, bridged: false };
      }
    } catch (err) {
      logger.error(
        { tenant_id: tenantId, call_id: callId, attempt, err: (err as Error).message },
        "retell outbound errored",
      );
      await storage.recordOutcome({ id, outcome: "retell_error", ring_duration_seconds: null });
    }

    if (attempt < maxAttempts) {
      const backoff = backoffSeconds[Math.min(attempt - 1, backoffSeconds.length - 1)] ?? 10;
      await sleepFn(backoff);
    }
  }

  // Exhausted attempts — mark the lead as urgent_unbridged so the dashboard surfaces it.
  return { outcome: "urgent_unbridged", attempts, bridged: false };
}
