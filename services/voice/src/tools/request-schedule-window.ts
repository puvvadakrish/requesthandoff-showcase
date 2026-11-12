/**
 * request_schedule_window — return the next-N available windows the agent can offer the caller.
 *
 * MVP: derive windows from the tenant's hours. The agent captures the caller's
 * preferred window; the owner makes the actual booking decision (per R5/R6).
 * No calendar booking at MVP per scope boundaries.
 */
import { ok, type ToolContext, type ToolResponse } from "./types.js";

export interface ScheduleWindow {
  start: string; // ISO 8601 in tenant local time
  end: string;
  label: string; // human-readable for the agent to read aloud
}

export interface RequestScheduleWindowResult {
  windows: ScheduleWindow[];
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function requestScheduleWindow(ctx: ToolContext): ToolResponse<RequestScheduleWindowResult> {
  const startedAt = Date.now();
  const windows: ScheduleWindow[] = [];

  // Walk the next 7 days; emit a morning + afternoon window for any open day.
  for (let dayOffset = 0; dayOffset < 7 && windows.length < 4; dayOffset++) {
    const candidate = new Date(ctx.now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dayKey = DAY_KEYS[candidate.getUTCDay()];
    if (!dayKey) continue;
    const day = ctx.tenant.hours[dayKey];
    if (!day || day.closed) continue;

    const dateLabel = candidate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    windows.push({
      start: `${candidate.toISOString().slice(0, 10)}T${day.open}:00`,
      end: `${candidate.toISOString().slice(0, 10)}T13:00:00`,
      label: `${dateLabel} morning`,
    });
    if (windows.length >= 4) break;
    windows.push({
      start: `${candidate.toISOString().slice(0, 10)}T13:00:00`,
      end: `${candidate.toISOString().slice(0, 10)}T${day.close}:00`,
      label: `${dateLabel} afternoon`,
    });
  }

  return ok({ windows }, startedAt);
}
