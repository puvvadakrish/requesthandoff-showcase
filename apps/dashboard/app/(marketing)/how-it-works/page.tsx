/**
 * /how-it-works — full handoff flow page (plan U17 + D16 Variant A).
 *
 * Pattern: Local Operator Premium with extended product proof.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works | RequestHandoff",
  description:
    "How RequestHandoff covers calls and hands off structured leads — answer, qualify, deliver. No transcripts to dig through, no CRM to switch.",
};

const steps = [
  {
    kicker: "01 · Answer",
    title: "When your crew is on a roof, under a sink, or off for the night.",
    body: "Your line forwards to a number we provision. The agent picks up with the business facts you approved — not a generic script.",
    detail: "Conditional forwarding from your existing carrier. Most owners use no-answer forwarding so calls only route to us when you can't pick up. Setup takes about 30 seconds on most carriers.",
  },
  {
    kicker: "02 · Qualify",
    title: "Vertical-aware intake the owner approves.",
    body: "HVAC system-down, plumbing burst pipe, or a general-business callback request — the agent runs your playbook, not a generic flow.",
    detail: "Life-safety phrases (fire, flooding, gas, medical) escalate every time. Vertical-specific rules (no cooling + vulnerable occupant) escalate when the playbook matches. Everything else captures a clean lead.",
  },
  {
    kicker: "03 · Deliver",
    title: "The lead lands where your team already works.",
    body: "Jobber, email, a webhook to anything (Make, Zapier, Sheets, Slack). Caller, service, urgency, location, preferred window, missing details, recommended next action.",
    detail: "We never replace your dispatch tool. The dashboard is a receipt and a backup — not a system of record.",
  },
];

const escalationSteps = [
  ["00:00", "Caller dials your published number"],
  ["00:01", "Carrier forwards to our DID after no answer"],
  ["00:03", "Agent answers with your greeting + recording disclosure"],
  ["00:30", "Agent runs vertical intake; urgency rule fires"],
  ["00:32", "Owner phone rings; warm-transfer brief delivered on pickup"],
  ["00:35", "Caller bridged in; agent drops off"],
  ["00:90", "Structured lead lands in your inbox + Jobber"],
];

export default function HowItWorksPage() {
  return (
    <main className="site-shell">
      <nav className="nav" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="RequestHandoff home">
          <span className="brand-mark">RH</span>
          <span>RequestHandoff</span>
        </Link>
        <div className="nav-links">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/missed-call-audit">Missed-call audit</Link>
        </div>
        <a className="nav-cta" href="mailto:krish@requesthandoff.com">
          Build my demo
        </a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">How the handoff works</p>
          <h1>Coverage without changing how the shop runs.</h1>
          <p className="hero-lede">
            Three steps and a hard rule: every call covered, every lead handed off into the tools
            your crew already uses. We never become the system of record.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="mailto:krish@requesthandoff.com">
              Build my demo
            </a>
            <Link className="secondary-button" href="/pricing">
              See flat pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="handoff-section" id="handoff">
        <div className="section-heading">
          <p className="eyebrow">Three steps</p>
          <h2>Answer. Qualify. Deliver.</h2>
        </div>
        <div className="handoff-grid">
          {steps.map((step) => (
            <article className="step" key={step.kicker}>
              <p>{step.kicker}</p>
              <h3>{step.title}</h3>
              <span style={{ display: "block", marginBottom: "1rem" }}>{step.body}</span>
              <span style={{ color: "var(--muted)", fontSize: "0.92rem" }}>{step.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="product-proof-section" aria-label="Urgent-escalation timeline">
        <div className="product-proof-copy">
          <p className="eyebrow">Urgent-call timeline</p>
          <h2>Ninety seconds from caller dialing to owner on the line.</h2>
          <p>
            When an urgency rule fires, the agent doesn&apos;t pause to think. The owner gets a
            warm-transfer brief, the caller is bridged in, and the lead summary still lands in
            email and Jobber regardless of whether the bridge succeeded.
          </p>
        </div>
        <div className="handoff-log">
          <div className="handoff-log-header">
            <span>Live escalation</span>
            <strong>Northside HVAC · Saturday 7:42pm</strong>
          </div>
          <div className="handoff-log-table">
            {escalationSteps.map(([time, label]) => (
              <div className="handoff-log-row" key={time}>
                <span>{time}</span>
                <strong>{label}</strong>
                <em>step</em>
                <span>auto</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="demo-section" id="demo" aria-label="Build my demo CTA">
        <div>
          <p className="eyebrow">Done-for-you demo</p>
          <h2>The fastest way to see this is to hear it.</h2>
          <p>
            Email your website. We&apos;ll build a preview agent against your services, hours, and
            coverage area, then send a link you can call to test. Setup happens after.
          </p>
          <a className="primary-button" href="mailto:krish@requesthandoff.com" style={{ marginTop: "1.6rem" }}>
            Build my demo
          </a>
        </div>
      </section>
    </main>
  );
}
