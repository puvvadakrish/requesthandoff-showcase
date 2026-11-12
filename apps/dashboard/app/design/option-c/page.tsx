import Link from "next/link";

const auditStats = [
  ["27-40%", "home-service calls missed in normal and peak periods"],
  ["85%", "missed callers who do not leave voicemail"],
  ["$0", "per-call escalation surcharge"],
];

const recoveredJobs = [
  "After-hours no-cooling call",
  "Saturday leak callback",
  "Lunch-hour quote request",
  "Overflow call during peak heat",
];

export default function MissedRevenueOption() {
  return (
    <main className="variant variant-audit">
      <nav className="variant-nav audit-nav" aria-label="Design option navigation">
        <Link href="/" className="variant-brand">
          <span>RH</span>
          RequestHandoff
        </Link>
        <div>
          <Link href="/">Current</Link>
          <Link href="/design/option-b">Option B</Link>
          <a href="mailto:krish@requesthandoff.com">Run audit</a>
        </div>
      </nav>

      <section className="audit-hero">
        <div className="audit-photo" aria-hidden="true" />
        <div className="audit-copy">
          <p className="variant-label">Option C / Missed Revenue Audit</p>
          <h1>Find the calls that should have become jobs.</h1>
          <p>
            A sharper sales-led direction: lead with lost revenue, prove the
            weekly recovery story, then make flat-rate call coverage feel like
            the obvious fix.
          </p>
          <a href="mailto:krish@requesthandoff.com">Start with my website</a>
        </div>
      </section>

      <section className="audit-stats" aria-label="Missed call economics">
        {auditStats.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="audit-report">
        <div className="report-copy">
          <p className="variant-label">Weekly ROI report</p>
          <h2>Show the owner what got recovered before Monday starts.</h2>
          <p>
            Calls covered, qualified leads, urgent escalations, estimated job
            value, and which leads were handed off into the current workflow.
          </p>
        </div>
        <div className="report-card" aria-label="Example weekly report">
          <div>
            <span>Recovered this week</span>
            <strong>$8,740</strong>
          </div>
          <ul>
            {recoveredJobs.map((job) => (
              <li key={job}>{job}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="audit-close">
        <p>Flat monthly price. No escalation fees. No CRM lock-in.</p>
        <h2>Turn voicemail into a clean handoff.</h2>
        <a href="mailto:krish@requesthandoff.com">Build my demo</a>
      </section>
    </main>
  );
}
