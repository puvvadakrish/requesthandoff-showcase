/**
 * POST /api/admin/extract — pre-demo extractor stub (plan U22).
 *
 * Route handler is gated by requireFounderForApi (round 1 SEC-002). The actual
 * Gemini extraction + Retell demo agent provisioning is wired in a follow-up
 * commit once real Vertex AI + Retell credentials are present; this stub
 * returns the draft shape so the UI can be built end-to-end.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireFounderForApi } from "../../../../lib/auth/require-founder";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireFounderForApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const formData = await request.formData();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  if (!websiteUrl) {
    return NextResponse.json({ error: "missing_website_url" }, { status: 400 });
  }
  const gbpUrl = String(formData.get("gbp_url") ?? "").trim() || null;

  // Real implementation (next session, real Vertex AI):
  //   1. Fetch the website + GBP via WebFetch + a small HTML-to-text pass
  //   2. Run Gemini 3 Flash with a structured-output schema returning
  //      tenant config + per-field confidence
  //   3. Insert a `tenants` row with status=draft + a `demo_sessions` row
  //      pre-approved by the founder (founder_approved=true since the
  //      founder is the caller of this endpoint)
  //   4. Return the draft + the public demo URL
  //
  // For now, return a 501 with the shape we'll honor so the UI work can
  // proceed without blocking on Vertex AI credentials.

  return NextResponse.json(
    {
      status: "not_implemented",
      message:
        "Extraction wires in a follow-up commit. The route is auth-gated and ready for the Gemini call.",
      received: { website_url: websiteUrl, gbp_url: gbpUrl },
    },
    { status: 501 },
  );
}
