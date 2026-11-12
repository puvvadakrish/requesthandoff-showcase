/**
 * /pricing — flat-rate pricing page (plan U17 + D16 Variant A).
 *
 * Pattern: Local Operator Premium pricing pattern from page-patterns.md.
 * The job is to make price feel predictable and low-risk.
 *
 * Trust copy is load-bearing — "No escalation fees, ever" comes from
 * STRATEGY.md positioning rule #5 + GTM-PLAYBOOK.md anchoring logic.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | RequestHandoff",
  description:
    "Flat-rate pricing for call coverage and lead handoff. No escalation fees, no per-minute traps, no CRM lock-in. Starter $79, Growth $179, Pro $349.",
};

const tiers = [
  {
    name: "Starter",
    monthly: "$79",
    annual: "$65/mo billed annually",
    headline: "75 calls / month",
    points: [
      "1 number",
      "Email lead summaries",
      "Business-hours email escalation",
      "General + HVAC vertical scaffolds",
      "Texas recording disclosure",
    ],
  },
  {
    name: "Growth",
    monthly: "$179",
    annual: "$149/mo billed annually",
    headline: "250 calls / month",
    points: [
      "1 number",
      "24/7 coverage",
      "Urgent live-call escalation via warm transfer",
      "Generic outbound webhook URL",
      "Custom qualification flow",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    monthly: "$349",
    annual: "$289/mo billed annually",
    headline: "600 calls / month",
    points: [
      "1 number",
      "24/7 coverage + everything in Growth",
      "Direct Jobber integration",
      "Priority support",
      "(Multi-line, Spanish, ServiceTitan, native Zapier app — v1.1)",
    ],
  },
];

const trustPoints = [
  "Overage at $0.49/call. No escalation fees, ever.",
  "No per-minute billing.",
  "No CRM lock-in. We hand off, we don't take over.",
  "$10 credit for any verified missed escalation while we onboard the first 10 logos.",
];

export default function PricingPage() {
  return (
    <main className="site-shell">
      <nav className="nav" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="RequestHandoff home">
          <span className="brand-mark">RH</span>
          <span>RequestHandoff</span>
        </Link>
        <div className="nav-links">
          <Link href="/#handoff">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/missed-call-audit">Missed-call audit</Link>
        </div>
        <a className="nav-cta" href="mailto:krish@requesthandoff.com">
          Build my demo
        </a>
      </nav>

      <section className="pricing-section" id="pricing">
        <div className="section-heading">
          <p className="eyebrow">Flat-rate trust</p>
          <h2>Three plans. No escalation surcharge.</h2>
          <p style={{ color: "rgba(255, 250, 240, 0.72)", maxWidth: "44rem" }}>
            You shouldn&apos;t be billed extra when the agent does its job. Pick the call volume
            that fits your shop. Overage is one number, the same for every plan.
          </p>
        </div>

        <div className="pricing-grid">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className="plan"
              style={
                tier.highlight
                  ? {
                      background: "rgba(216, 173, 99, 0.16)",
                      borderColor: "rgba(216, 173, 99, 0.4)",
                    }
                  : undefined
              }
            >
              <p>{tier.name}</p>
              <h3>
                {tier.monthly}
                <span> /mo</span>
              </h3>
              <span style={{ display: "block", marginBottom: "1rem", opacity: 0.8 }}>
                {tier.annual}
              </span>
              <span
                style={{
                  display: "block",
                  marginBottom: "1.2rem",
                  fontWeight: 800,
                  color: "var(--paper-strong)",
                }}
              >
                {tier.headline}
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {tier.points.map((point) => (
                  <li
                    key={point}
                    style={{
                      borderTop: "1px solid rgba(255, 250, 240, 0.16)",
                      padding: "0.7rem 0",
                      color: "rgba(255, 250, 240, 0.78)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="overage" style={{ textAlign: "center", marginTop: "2.4rem" }}>
          Overage at <strong style={{ color: "var(--paper-strong)" }}>$0.49 / call</strong>. Same
          for every plan.
        </p>
      </section>

      <section className="missed-call-section" aria-label="What flat-rate means">
        <div className="missed-call-copy">
          <p className="eyebrow">What flat-rate actually means</p>
          <h2>Predictable billing. Period.</h2>
          <p>
            We attack the bill-shock pattern in this category. Every promise on the price page is
            written down so you can hold us to it.
          </p>
        </div>
        <div className="recovery-card" aria-label="Pricing trust commitments">
          <div className="recovery-total">
            <span>Trust commitments</span>
            <strong style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>4 promises</strong>
          </div>
          <ul>
            {trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="demo-section" id="demo" aria-label="Build my demo CTA">
        <div>
          <p className="eyebrow">Done-for-you demo</p>
          <h2>Hear your own business answer the phone before you switch anything.</h2>
          <p>
            Email Krish with your website and the closest hour you can spare. We&apos;ll build a
            preview agent from your site, send back a link to listen, and only set anything up if
            it sounds right.
          </p>
          <a className="primary-button" href="mailto:krish@requesthandoff.com" style={{ marginTop: "1.6rem" }}>
            Build my demo
          </a>
        </div>
      </section>
    </main>
  );
}
