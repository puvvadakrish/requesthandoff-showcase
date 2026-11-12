/**
 * /demo/[demoId] — public clickable demo URL (plan U22 abuse protection).
 *
 * Renders the prospect's pre-extracted business preview + a "Try the demo"
 * button that initiates a Retell web-call session. Backed by:
 *   - per-demo max_sessions cap
 *   - per-IP rate limit (1 session / 60 min) at /api/demo/[id]/connect
 *   - optional Cloudflare Turnstile when DEMO_TURNSTILE_REQUIRED=true
 *   - daily Retell-spend circuit-breaker in observability
 *   - separate Retell `demo` agent (NOT the production tenant agent)
 *   - founder pre-flight approval gate (founder_approved must be true)
 *   - 14-day expiry
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import { buildGeneralDemoConfig, DemoConfigSchema, type DemoConfig } from "@requesthandoff/schema";
import { getSupabase } from "@/lib/supabase/server";

import { DemoClient } from "./demo-client";

const DEFAULT_BOOKING_URL = "https://cal.com/your-handle/30min";
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "numeric",
  timeZone: "America/Chicago",
  year: "numeric",
});

function founderBookingUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_FOUNDER_BOOKING_URL?.trim();
  if (!configuredUrl) return DEFAULT_BOOKING_URL;

  try {
    const parsedUrl = new URL(configuredUrl);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:"
      ? parsedUrl.toString()
      : DEFAULT_BOOKING_URL;
  } catch {
    return DEFAULT_BOOKING_URL;
  }
}

interface PageProps {
  params: Promise<{ demoId: string }>;
}

interface DemoSession {
  demo_id: string;
  prospect_business_name: string;
  prospect_website_url: string | null;
  extracted_config: {
    business_name?: string;
    vertical?: string;
    services_offered?: string[];
    services_not_offered?: string[];
    brand_logo_url?: string | null;
    service_area?: string;
    hours_summary?: string;
    coverage_summary?: string;
    correction_needed?: string[];
    safety_boundaries?: string[];
  };
  session_count: number;
  max_sessions: number;
  expires_at: string;
  founder_approved: boolean;
}

async function loadSession(demoId: string): Promise<DemoSession | null> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .rpc("get_public_demo_session", { p_demo_id: demoId })
    .maybeSingle();
  return (data as DemoSession | null) ?? null;
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function boundaryLabel(boundary: string): string {
  return boundary
    .replace(/^no_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function nonEmptyStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function optionalUrl(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function demoConfigForSession(session: DemoSession): DemoConfig {
  const parsedConfig = DemoConfigSchema.safeParse(session.extracted_config ?? {});
  if (parsedConfig.success) return parsedConfig.data;

  const extractedConfig = session.extracted_config ?? {};
  const servicesOffered = nonEmptyStrings(extractedConfig.services_offered);
  const correctionNeeded = nonEmptyStrings(extractedConfig.correction_needed);

  return buildGeneralDemoConfig({
    businessName: optionalString(extractedConfig.business_name) ?? session.prospect_business_name,
    websiteUrl: session.prospect_website_url,
    brandLogoUrl: optionalUrl(extractedConfig.brand_logo_url),
    servicesOffered: servicesOffered.length > 0 ? servicesOffered : ["general requests"],
    servicesNotOffered: nonEmptyStrings(extractedConfig.services_not_offered),
    serviceArea:
      optionalString(extractedConfig.service_area) ??
      optionalString(extractedConfig.coverage_summary) ??
      "Correction needed",
    hoursSummary: optionalString(extractedConfig.hours_summary) ?? "Correction needed",
    correctionNeeded:
      correctionNeeded.length > 0
        ? correctionNeeded
        : ["service area", "hours", "handoff destination"],
    handoffDestination: "email",
    notes: "Fallback preview generated because the saved demo config was incomplete.",
  });
}

function formatDate(date: string): string {
  return DATE_FORMATTER.format(new Date(date));
}

export default async function DemoPage({ params }: PageProps) {
  const { demoId } = await params;
  const session = await loadSession(demoId);
  if (!session) {
    notFound();
  }

  const now = Date.now();
  const expired = new Date(session.expires_at).getTime() < now;
  const exhausted = session.session_count >= session.max_sessions;
  const notApproved = !session.founder_approved;
  const blocked = expired || exhausted || notApproved;
  const blockReason = expired
    ? "This preview link has expired. Email Krish for a fresh one."
    : exhausted
      ? "This preview has been listened to the maximum number of times. Email Krish if you want a fresh one."
      : notApproved
        ? "This preview is still being reviewed. Check back shortly or email Krish."
        : "";

  const cfg = demoConfigForSession(session);
  const businessName = cfg.business_name ?? session.prospect_business_name;
  const bookingUrl = founderBookingUrl();
  const expiresAtLabel = formatDate(session.expires_at);
  const logoInitials = initialsFor(businessName);
  const correctionItems =
    cfg.correction_needed.length > 0
      ? cfg.correction_needed
      : ["service area", "hours", "handoff destination"];

  return (
    <main className="site-shell demo-preview-shell">
      <nav className="nav" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="RequestHandoff home">
          <span className="brand-mark">RH</span>
          <span>RequestHandoff</span>
        </Link>
        <a className="nav-cta" href={bookingUrl} target="_blank" rel="noopener noreferrer">
          Schedule 30 min
        </a>
      </nav>

      <section className="demo-preview-hero" id="top">
        <div className="demo-preview-intro">
          <div className="demo-preview-badge" aria-label={`${businessName} preview`}>
            <span className="demo-preview-logo">
              {cfg.brand_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.brand_logo_url} alt={`${businessName} logo`} />
              ) : (
                logoInitials
              )}
            </span>
            <span>
              <strong>{businessName}</strong>
              <em>Private preview</em>
            </span>
          </div>
          <p className="eyebrow">Preview built from public facts</p>
          <h1 className="demo-preview-title">Listen before anything changes.</h1>
          <p className="demo-preview-lede">
            RequestHandoff has pre-loaded the facts we could defend from your website and founder
            notes. Try the call, then review the structured handoff format your team would receive.
          </p>

          <DemoClient
            demoId={session.demo_id}
            handoffDestination={cfg.handoff_destination}
            hasVehicleIntakeField={cfg.intake_fields.includes("vehicle_year_make_model")}
            urgencyPreview={cfg.urgency_rules[0] ?? "Owner review"}
            blocked={blocked}
            blockReason={blockReason}
            sessionCount={session.session_count}
            maxSessions={session.max_sessions}
            expiresAtLabel={expiresAtLabel}
            bookingUrl={bookingUrl}
          />
        </div>

        <div className="demo-preview-panel" aria-label="Extracted preview">
          <div className="demo-preview-panel-header">
            <span>Extracted profile</span>
            <strong>Founder reviewed</strong>
          </div>
          <div className="demo-preview-business">
            <span className="demo-preview-logo demo-preview-logo-large">
              {cfg.brand_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.brand_logo_url} alt="" />
              ) : (
                logoInitials
              )}
            </span>
            <div>
              <h2>{businessName}</h2>
              <p>{cfg.website_url ?? session.prospect_website_url ?? "Website source on file"}</p>
            </div>
          </div>

          <dl className="demo-preview-facts">
            <div>
              <dt>Preview type</dt>
              <dd>{cfg.vertical.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>{cfg.hours_summary || "Correction needed"}</dd>
            </div>
            <div>
              <dt>Coverage</dt>
              <dd>{cfg.service_area}</dd>
            </div>
            <div>
              <dt>Handoff</dt>
              <dd>
                {cfg.handoff_destination === "webhook"
                  ? "Webhook / automation"
                  : cfg.handoff_destination === "phone_review"
                    ? "Founder phone review"
                    : "Email summary"}
              </dd>
            </div>
          </dl>

          <div className="demo-preview-stack">
            <div>
              <h3>Questions the call can handle</h3>
              <ul>
                {cfg.services_offered.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Guardrails</h3>
              <ul>
                {(cfg.services_not_offered.length > 0
                  ? cfg.services_not_offered
                  : cfg.safety_boundaries.slice(0, 5).map(boundaryLabel)
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="demo-correction-section">
        <div className="demo-correction-copy">
          <p className="eyebrow">Correction needed</p>
          <h2>Tell us what is wrong.</h2>
          <p>
            This preview is intentionally built from public facts and founder notes. Nothing routes
            to production, and nothing changes your current tools. Corrections make the next run
            sound more like your actual front desk.
          </p>
          <div className="demo-schedule-card">
            <div>
              <strong>Want to walk through it live?</strong>
              <span>
                Book 30 minutes with Krish to review what the call captured and what to change
                before a pilot.
              </span>
            </div>
            <a
              className="primary-button"
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Schedule 30 minutes
            </a>
          </div>
        </div>
        <div className="demo-correction-grid">
          {correctionItems.map((item) => (
            <div className="demo-correction-card" key={item}>
              <strong>{item}</strong>
              <span>Review with Krish before pilot setup.</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
