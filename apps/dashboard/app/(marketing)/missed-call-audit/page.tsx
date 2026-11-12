/**
 * /missed-call-audit — cold-outreach landing page (plan U17 + D16 Variant C).
 *
 * Pattern: Missed Revenue Audit from page-patterns.md.
 * Direct-response framing for skeptical owners who saw a cold email.
 *
 * IMPORTANT: this is the LANDING PAGE, not the (removed) audit dialer. We do
 * NOT call prospects' numbers. The CTA points at a website-based extractor
 * demo per the demo-IS-kickoff motion.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Missed-call audit | RequestHandoff",
  description:
    "27-40% of home-service calls go to voicemail and 85% of those callers don't leave a message. See what your shop is missing — then hear how we'd cover it.",
};

const stats = [
  { value: "27-40%", label: "Home-service calls missed during peak periods" },
  { value: "85%", label: "Missed callers who don't leave a voicemail" },
  { value: "$1,200", label: "Average lifetime value of one HVAC call (industry data)" },
];

const reportRows = [
  "Friday 7:42 PM · Pflugerville · AC stopped cooling",
  "Saturday 11:14 AM · Round Rock · Drain backup",
  "Sunday 9:00 AM · Cedar Park · Quote for ductwork",
  "Sunday 6:48 PM · Austin · Warranty callback",
];

export default function MissedCallAuditPage() {
  return (
    <main className="variant variant-audit">
      <nav className="variant-nav audit-nav" aria-label="Primary navigation">
        <Link className="variant-brand" href="/" aria-label="RequestHandoff home">
          <span>RH</span>
          <span>RequestHandoff</span>
        </Link>
        <div>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <a href="mailto:krish@requesthandoff.com">Build my demo</a>
        </div>
      </nav>

      <section className="audit-hero">
        <div className="audit-photo" aria-hidden="true" />
        <div className="audit-copy">
          <p className="variant-label">Missed-call audit · Austin metro</p>
          <h1>Find the calls that should have become jobs.</h1>
          <p>
            Home-service calls are the most expensive thing a shop can drop. Most owners see the
            voicemail count and assume their team got back to people. The data says otherwise.
          </p>
          <a href="mailto:krish@requesthandoff.com">Build my demo from my website</a>
        </div>
      </section>

      <section className="audit-stats" aria-label="Industry economics of missed calls">
        {stats.map(({ value, label }) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="audit-report">
        <div className="report-copy">
          <p className="variant-label">Sample weekly recovery report</p>
          <h2>Your week, audited.</h2>
          <p>
            We can&apos;t call your prospects on your behalf, and we won&apos;t. What we can do is
            stand up a preview agent against your website, hours, and coverage area, send you a
            link to call, and show you how the leads we&apos;d capture this week look in your
            inbox.
          </p>
          <a href="mailto:krish@requesthandoff.com">Build my demo from my website</a>
        </div>
        <div className="report-card">
          <div>
            <span>Week of May 4-10</span>
            <strong>$8,740</strong>
          </div>
          <ul>
            {reportRows.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="audit-close">
        <p>The flat-rate promise</p>
        <h2>$79, $179, $349. No escalation fees, ever.</h2>
        <p style={{ color: "rgba(255, 248, 234, 0.72)", marginTop: "1.4rem", maxWidth: "44rem" }}>
          We attack the Smith.ai surcharge model directly. You pay the same rate every month.
          Overage is $0.49/call. Urgent calls don&apos;t cost extra.
        </p>
        <Link href="/pricing">See flat pricing</Link>
      </section>
    </main>
  );
}
