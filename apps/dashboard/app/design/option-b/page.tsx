import Link from "next/link";

const consoleRows = [
  ["7:42 PM", "No cooling upstairs", "Urgent", "Warm transfer"],
  ["6:18 PM", "Quote for mini split", "Standard", "Jobber lead"],
  ["12:07 PM", "Warranty callback", "Low", "Owner email"],
  ["8:31 AM", "Service area check", "Standard", "Webhook"],
];

const dispatchMetrics = [
  ["38", "calls covered"],
  ["12", "qualified leads"],
  ["4", "urgent reviews"],
  ["0", "escalation fees"],
];

export default function DispatchConsoleOption() {
  return (
    <main className="variant variant-console">
      <nav className="variant-nav" aria-label="Design option navigation">
        <Link href="/" className="variant-brand">
          <span>RH</span>
          RequestHandoff
        </Link>
        <div>
          <Link href="/">Current</Link>
          <Link href="/design/option-c">Option C</Link>
          <a href="mailto:krish@requesthandoff.com">Build demo</a>
        </div>
      </nav>

      <section className="console-hero">
        <div className="console-copy">
          <p className="variant-label">Option B / Dispatch Console</p>
          <h1>Call coverage that feels like ops, not another inbox.</h1>
          <p>
            A dense, work-focused direction for RequestHandoff: every missed
            call becomes a structured lead, routed with status, urgency, and
            delivery proof.
          </p>
          <div className="console-actions">
            <a href="mailto:krish@requesthandoff.com">Preview my console</a>
            <span>No CRM switch. No escalation fees.</span>
          </div>
        </div>

        <div className="ops-panel" aria-label="Dispatch console preview">
          <div className="ops-header">
            <span>Live handoff board</span>
            <strong>Northside HVAC</strong>
          </div>
          <div className="ops-metrics">
            {dispatchMetrics.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="ops-table">
            {consoleRows.map(([time, issue, urgency, route]) => (
              <div className="ops-row" key={`${time}-${issue}`}>
                <span>{time}</span>
                <strong>{issue}</strong>
                <em>{urgency}</em>
                <span>{route}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="console-band">
        <article>
          <p>Structured record</p>
          <h2>Caller, service, location, window, urgency, confidence.</h2>
        </article>
        <article>
          <p>Rule-driven escalation</p>
          <h2>The owner defines what gets bridged live.</h2>
        </article>
        <article>
          <p>Delivery proof</p>
          <h2>Every handoff is logged by destination and outcome.</h2>
        </article>
      </section>

      <section className="console-flow">
        <div>
          <p className="variant-label">Designed for repeated daily use</p>
          <h2>The dashboard becomes the receipt, not the system of record.</h2>
        </div>
        <div className="console-flow-grid">
          <span>Call answered</span>
          <span>Lead qualified</span>
          <span>Urgency checked</span>
          <span>Jobber / email / webhook</span>
        </div>
      </section>
    </main>
  );
}
