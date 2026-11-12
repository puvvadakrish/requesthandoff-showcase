/**
 * Structured logger (plan U24 — first slice in Week 2).
 *
 * Hot-path tool calls emit one line per call with tenant_id, tool, latency_ms, outcome.
 * PII fields (caller name/phone/email/address) MUST NOT appear in logs (R25).
 */
import pino from "pino";

export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  base: { service: "voice", region: process.env["RENDER_REGION"] ?? "local" },
  // Render captures stdout JSON natively; no need for pretty transport in prod.
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Defense-in-depth PII scrubber — caller_* fields never appear in hot-path logs,
  // but if a future contributor accidentally logs a transcript or webhook body,
  // pino's redaction nukes the field rather than leaking it.
  redact: {
    paths: [
      "caller_name",
      "caller_phone",
      "caller_email",
      "caller_address",
      "*.caller_name",
      "*.caller_phone",
      "*.caller_email",
      "*.caller_address",
      "transcript",
      "*.transcript",
    ],
    censor: "[REDACTED]",
  },
});

export type Logger = typeof logger;
