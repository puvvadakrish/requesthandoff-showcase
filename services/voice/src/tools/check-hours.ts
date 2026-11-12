/**
 * check_hours — does the agent treat this call as inside business hours? (R8, AE1)
 *
 * Pure function over tenant.hours + the request time. No DB roundtrip needed
 * once the tenant config is cached.
 */
import { fail, ok, type ToolContext, type ToolResponse } from "./types.js";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export interface CheckHoursResult {
  is_open: boolean;
  reason: string;
  /** Local-tenant-time HH:MM. Useful for the agent to mention "we open at 8am". */
  next_open_at?: string;
}

export function checkHours(ctx: ToolContext): ToolResponse<CheckHoursResult> {
  const startedAt = Date.now();
  const dayKey = DAY_KEYS[ctx.now.getUTCDay()];
  if (!dayKey) {
    return fail("invalid_day", "Failed to compute day-of-week", startedAt);
  }

  const day = ctx.tenant.hours[dayKey];
  if (!day || day.closed) {
    return ok(
      { is_open: false, reason: "closed_for_day" },
      startedAt,
    );
  }

  const minutesNow = ctx.now.getUTCHours() * 60 + ctx.now.getUTCMinutes();
  const open = parseHHMM(day.open);
  const close = parseHHMM(day.close);
  if (open === null || close === null) {
    return fail("invalid_hours_config", `bad hours for ${dayKey}`, startedAt);
  }
  if (minutesNow < open) {
    return ok({ is_open: false, reason: "before_open", next_open_at: day.open }, startedAt);
  }
  if (minutesNow >= close) {
    return ok({ is_open: false, reason: "after_close" }, startedAt);
  }
  return ok({ is_open: true, reason: "open" }, startedAt);
}

function parseHHMM(value: string): number | null {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}
