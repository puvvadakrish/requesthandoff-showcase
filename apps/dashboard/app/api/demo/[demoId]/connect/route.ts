/**
 * POST /api/demo/[demoId]/connect — public Retell web-call session token issuance
 * (plan U22 abuse protection).
 *
 * Validates:
 *   1. Optional Cloudflare Turnstile token when DEMO_TURNSTILE_REQUIRED=true
 *   2. Per-IP rate limit (1 session per 60 min) — server-side by IP hash
 *   3. demoId session_count < max_sessions
 *   4. demoId.expires_at > now
 *   5. demoId.founder_approved is true (founder pre-flight gate)
 *   6. monthly demo-session spend circuit-breaker still under DEMO_MONTHLY_BUDGET_USD
 *
 * On pass: reserves a demo session, provisions a Retell web-call token bound
 * to the shared `demo` agent with the prospect's extracted_config injected as
 * a dynamic prompt, returns the token + Retell SDK config to the client.
 */
import { NextResponse, type NextRequest } from "next/server";

import { createServiceSupabase } from "@requesthandoff/supabase-client-service";
import {
  DEFAULT_DEMO_ESTIMATED_SESSION_COST_USD,
  DEMO_IP_RATE_LIMIT_WINDOW_MS,
  demoIpHashSalt,
  extractClientIp,
  hashDemoClientIp,
  notifyFounderDemoStarted,
  positiveNumberFromEnv,
  shouldPauseForDemoBudget,
  verifyTurnstileToken,
} from "@/lib/demo/connect-guards";
import { createDemoWebCall } from "@/lib/demo/retell-provider";

interface RouteContext {
  params: Promise<{ demoId: string }>;
}

interface ConnectRequestBody {
  turnstileToken?: string;
}

function errorResponse(error: string, status: number, message?: string) {
  return NextResponse.json({ error, ...(message ? { message } : {}) }, { status });
}

function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { demoId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as ConnectRequestBody;
  const turnstile = await verifyTurnstileToken({
    request,
    token: body.turnstileToken,
  });

  if (!turnstile.ok) {
    return errorResponse(turnstile.error ?? "turnstile_failed", turnstile.status ?? 403);
  }

  const supabase = createServiceSupabase();
  const ipHash = hashDemoClientIp(extractClientIp(request), demoIpHashSalt());

  const { data: session } = await supabase
    .from("demo_sessions")
    .select(
      "demo_id, session_count, max_sessions, expires_at, founder_approved, extracted_config, prospect_business_name",
    )
    .eq("demo_id", demoId)
    .maybeSingle();

  if (!session) {
    return errorResponse("not_found", 404);
  }

  const now = Date.now();
  if (new Date(session.expires_at).getTime() < now) {
    return errorResponse("expired", 410);
  }
  if (!session.founder_approved) {
    return errorResponse("not_approved", 403);
  }
  if (session.session_count >= session.max_sessions) {
    return errorResponse("session_cap_reached", 429);
  }

  const rateWindowStart = new Date(now - DEMO_IP_RATE_LIMIT_WINDOW_MS).toISOString();
  const { count: recentAttemptCount, error: recentAttemptError } = await supabase
    .from("demo_session_attempts")
    .select("id", { count: "exact", head: true })
    .eq("demo_id", session.demo_id)
    .eq("ip_hash", ipHash)
    .gte("created_at", rateWindowStart);

  if (recentAttemptError) {
    return errorResponse("demo_guard_unavailable", 503);
  }

  if ((recentAttemptCount ?? 0) > 0) {
    return errorResponse(
      "rate_limited",
      429,
      "This demo can be tried once per hour from the same network. Email Krish or schedule a walkthrough if you need another run.",
    );
  }

  const { count: successfulSessionsThisMonth, error: budgetError } = await supabase
    .from("demo_session_attempts")
    .select("id", { count: "exact", head: true })
    .eq("succeeded", true)
    .gte("created_at", monthStartIso());

  if (budgetError) {
    return errorResponse("demo_guard_unavailable", 503);
  }

  const monthlyBudgetUsd = positiveNumberFromEnv("DEMO_MONTHLY_BUDGET_USD", 200);
  const estimatedSessionCostUsd = positiveNumberFromEnv(
    "DEMO_ESTIMATED_SESSION_COST_USD",
    DEFAULT_DEMO_ESTIMATED_SESSION_COST_USD,
  );
  if (
    shouldPauseForDemoBudget({
      monthlyBudgetUsd,
      estimatedSessionCostUsd,
      successfulSessionsThisMonth: successfulSessionsThisMonth ?? 0,
    })
  ) {
    return errorResponse(
      "demo_budget_paused",
      503,
      "Demo calls are temporarily paused. Email Krish or schedule a walkthrough.",
    );
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("demo_session_attempts")
    .insert({
      demo_id: session.demo_id,
      ip_hash: ipHash,
      turnstile_verified: turnstile.verified === true,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return errorResponse("demo_guard_unavailable", 503);
  }

  const reservedSessionCount = session.session_count + 1;
  const { data: reservedSession, error: reservationError } = await supabase
    .from("demo_sessions")
    .update({ session_count: reservedSessionCount })
    .eq("demo_id", session.demo_id)
    .eq("session_count", session.session_count)
    .lt("session_count", session.max_sessions)
    .select("demo_id")
    .maybeSingle();

  if (reservationError || !reservedSession) {
    return errorResponse("session_reservation_failed", 409);
  }

  let webCall;
  try {
    webCall = await createDemoWebCall({
      demoId: session.demo_id,
      prospectBusinessName: session.prospect_business_name,
      extractedConfig: session.extracted_config,
    });
  } catch {
    await supabase
      .from("demo_sessions")
      .update({ session_count: session.session_count })
      .eq("demo_id", session.demo_id)
      .eq("session_count", reservedSessionCount);

    return NextResponse.json(
      {
        error: "provider_error",
        message:
          "The demo call provider is temporarily unavailable. Email Krish or schedule a walkthrough.",
        session_count: session.session_count,
        max_sessions: session.max_sessions,
      },
      { status: 502 },
    );
  }

  await supabase
    .from("demo_session_attempts")
    .update({ succeeded: true, retell_call_id: webCall.call_id })
    .eq("id", attempt.id);

  await notifyFounderDemoStarted({
    demoId: session.demo_id,
    prospectBusinessName: session.prospect_business_name,
    sessionCount: reservedSessionCount,
    maxSessions: session.max_sessions,
    callId: webCall.call_id,
  });

  return NextResponse.json({
    status: "ready",
    message: "Demo call is ready.",
    access_token: webCall.access_token,
    call_id: webCall.call_id,
    agent_id: webCall.agent_id,
    agent_version: webCall.agent_version,
    call_status: webCall.call_status,
    session_count: reservedSessionCount,
    max_sessions: session.max_sessions,
  });
}
