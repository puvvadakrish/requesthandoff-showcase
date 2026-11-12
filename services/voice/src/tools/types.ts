/**
 * Shared types for the four hot-path tool endpoints (plan U7).
 *
 * Hard rule: no LLM SDK imports anywhere under services/voice/src/tools/.
 * The static-analysis check runs in CI to enforce this; latency budget
 * (p99 < 150ms per AE5) cannot survive a Vertex AI roundtrip on the hot path.
 */
import type { TenantConfig, UrgencyRule } from "@requesthandoff/schema";

/** Common request envelope from Retell function-call. The full body is verified
 *  upstream in the webhook receiver; tools see the resolved tenant + args. */
export interface ToolContext {
  tenant: TenantConfig;
  /** Composed urgency rules for the tenant — passed in so escalate_now matches against the same rule set the agent received. */
  urgencyRules: UrgencyRule[];
  /** Whether the tenant's primary state requires recording-disclosure on warm transfer (D11). */
  multiStateWarningRequired: boolean;
  /** Provided by the webhook receiver for log correlation. */
  callId: string;
  /** Wall-clock for deterministic tests + logs. */
  now: Date;
}

export interface ToolResult<T> {
  ok: true;
  data: T;
  latency_ms: number;
}

export interface ToolError {
  ok: false;
  error_code: string;
  message: string;
  latency_ms: number;
}

export type ToolResponse<T> = ToolResult<T> | ToolError;

export function ok<T>(data: T, startedAt: number): ToolResult<T> {
  return { ok: true, data, latency_ms: Date.now() - startedAt };
}

export function fail(code: string, message: string, startedAt: number): ToolError {
  return { ok: false, error_code: code, message, latency_ms: Date.now() - startedAt };
}
