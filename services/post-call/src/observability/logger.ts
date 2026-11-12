import pino from "pino";

export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  base: { service: "post-call", region: process.env["RENDER_REGION"] ?? "local" },
  formatters: {
    level: (label) => ({ level: label }),
  },
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
