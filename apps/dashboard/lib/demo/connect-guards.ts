import { createHash } from "node:crypto";

import type { NextRequest } from "next/server";

export const DEMO_IP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const DEFAULT_DEMO_ESTIMATED_SESSION_COST_USD = 0.75;

export interface GuardResult {
  ok: boolean;
  error?: string;
  status?: number;
  verified?: boolean;
}

export function extractClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) return firstIp.trim();
  }

  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function hashDemoClientIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function demoIpHashSalt(): string {
  return (
    process.env.DEMO_IP_HASH_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "development-demo-ip-salt"
  );
}

export function isProductionDeployment(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV)
  );
}

export function shouldRequireTurnstile(): boolean {
  return process.env.DEMO_TURNSTILE_REQUIRED?.trim().toLowerCase() === "true";
}

export function positiveNumberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function shouldPauseForDemoBudget({
  monthlyBudgetUsd,
  estimatedSessionCostUsd,
  successfulSessionsThisMonth,
}: {
  monthlyBudgetUsd: number;
  estimatedSessionCostUsd: number;
  successfulSessionsThisMonth: number;
}): boolean {
  return successfulSessionsThisMonth * estimatedSessionCostUsd >= monthlyBudgetUsd;
}

export async function verifyTurnstileToken({
  request,
  token,
}: {
  request: NextRequest;
  token: string | null | undefined;
}): Promise<GuardResult> {
  if (!shouldRequireTurnstile()) {
    return { ok: true, verified: false };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return isProductionDeployment()
      ? { ok: false, error: "turnstile_not_configured", status: 503 }
      : { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: "turnstile_required", status: 403 };
  }

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);
  const ip = extractClientIp(request);
  if (ip !== "unknown") formData.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const body = (await response.json().catch(() => ({}))) as { success?: boolean };
    return response.ok && body.success
      ? { ok: true, verified: true }
      : { ok: false, error: "turnstile_failed", status: 403 };
  } catch {
    return { ok: false, error: "turnstile_unavailable", status: 503 };
  }
}

export async function notifyFounderDemoStarted({
  demoId,
  prospectBusinessName,
  sessionCount,
  maxSessions,
  callId,
}: {
  demoId: string;
  prospectBusinessName: string;
  sessionCount: number;
  maxSessions: number;
  callId: string;
}): Promise<void> {
  const webhookUrl = process.env.FOUNDER_SLACK_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Demo call started: ${prospectBusinessName} (${demoId}) ${sessionCount}/${maxSessions} sessions, Retell call ${callId}`,
      }),
    });
  } catch {
    // Best-effort founder alert; never block a prospect after Retell succeeds.
  }
}
