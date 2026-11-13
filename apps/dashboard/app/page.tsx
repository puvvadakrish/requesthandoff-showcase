const integrations = [
  "Jobber",
  "Housecall Pro",
  "Email",
  "Slack",
  "Google Sheets",
  "Webhook",
];

const plans = [
  {
    name: "Starter",
    price: "$79",
    detail: "75 calls, 1 number, email lead summaries",
  },
  {
    name: "Growth",
    price: "$179",
    detail: "250 calls, 24/7 coverage, urgent warm transfer",
  },
  {
    name: "Pro",
    price: "$349",
    detail: "600 calls, integrations, priority support",
  },
];

const auditStats = [
  ["27-40%", "home-service calls missed during normal and peak periods"],
  ["85%", "missed callers who do not leave voicemail"],
  ["$0", "per-call escalation surcharge"],
];

const recoveredJobs = [
  "After-hours no-cooling call",
  "Saturday leak callback",
  "Lunch-hour quote request",
  "Overflow call during peak heat",
];

const handoffSteps = [
  {
    kicker: "Answer",
    title: "When your crew is on a roof, under a sink, or off for the night.",
    body: "RequestHandoff picks up with the business facts you approved, not a generic script.",
  },
  {
    kicker: "Qualify",
    title: "The call becomes a clean service request instead of a transcript pile.",
    body: "Caller, service need, location, urgency, preferred window, missing details, and next action.",
  },
  {
    kicker: "Deliver",
    title: "The lead lands where your team already works.",
    body: "Jobber, Housecall Pro, email, sheets, Slack, or a webhook. The dashboard is a backup, not a replacement.",
  },
];

const handoffRows = [
  ["7:42 PM", "AC stopped cooling upstairs", "Urgent", "Warm transfer + Jobber"],
  ["6:18 PM", "Quote for mini split", "Standard", "Jobber lead"],
  ["12:07 PM", "Warranty callback", "Low", "Owner email"],
  ["8:31 AM", "Outside service area", "Flagged", "Email with note"],
];

const setupItems = [
  "Services, hours, and coverage area pulled from your site",
  "Escalation rules approved with the owner",
  "Delivery tested into the tool the team already checks",
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <nav className="nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="RequestHandoff home">
          <span className="brand-mark">RH</span>
          <span>RequestHandoff</span>
        </a>
        <div className="nav-links">
          <a href="#handoff">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#demo">Demo</a>
        </div>
        <a className="nav-cta" href="mailto:krish@requesthandoff.com">
          Build my demo
        </a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Austin-local call coverage for home services</p>
          <h1>Every call covered. Every lead handed off.</h1>
          <p className="hero-lede">
            RequestHandoff answers when your team can&apos;t, qualifies the
            caller, escalates only by your rules, and delivers a structured lead
            into the tools you already use.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="mailto:krish@requesthandoff.com">
              Build my demo
            </a>
            <a className="secondary-button" href="#pricing">
              See flat pricing
            </a>
          </div>
        </div>

        <div className="hero-board" aria-label="Example captured service lead">
          <div className="photo-panel" />
          <div className="hero-receipt">
            <span>Recovered this week</span>
            <strong>$8,740</strong>
          </div>
          <div className="lead-card">
            <div className="lead-card-header">
              <span>New captured lead</span>
              <strong>7:42 PM</strong>
            </div>
            <h2>AC stopped cooling upstairs</h2>
            <dl>
              <div>
                <dt>Caller</dt>
                <dd>Sample caller, Austin</dd>
              </div>
              <div>
                <dt>Urgency</dt>
                <dd>Escalate: vulnerable occupant</dd>
              </div>
              <div>
                <dt>Handoff</dt>
                <dd>Sent to Jobber + owner email</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Positioning highlights">
        <p>No escalation fees, ever</p>
        <p>Built in Austin for Austin operators</p>
        <p>Works with your current dispatch tool</p>
      </section>

      <section className="missed-call-section">
        <div className="missed-call-copy">
          <p className="eyebrow">The voicemail problem</p>
          <h2>Find the calls that should have become jobs.</h2>
          <p>
            The first job is not to sound clever. It is to make sure the next
            caller with a real problem gets answered, qualified, and routed
            before they call the next company.
          </p>
        </div>
        <div className="audit-panel" aria-label="Missed call economics">
          {auditStats.map(([value, label]) => (
            <article key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="recovery-section">
        <div className="recovery-card" aria-label="Example weekly recovery report">
          <div className="recovery-total">
            <span>Weekly recovery report</span>
            <strong>$8,740</strong>
          </div>
          <ul>
            {recoveredJobs.map((job) => (
              <li key={job}>{job}</li>
            ))}
          </ul>
        </div>
        <div className="recovery-copy">
          <p className="eyebrow">Proof the owner can feel</p>
          <h2>Show what got recovered before Monday starts.</h2>
          <p>
            Calls covered, qualified leads, urgent escalations, and the exact
            destination of each handoff. The dashboard is the receipt; the work
            still lands in the system your crew already uses.
          </p>
        </div>
      </section>

      <section className="handoff-section" id="handoff">
        <div className="section-heading">
          <p className="eyebrow">How the handoff works</p>
          <h2>Coverage without asking you to change how the shop runs.</h2>
        </div>
        <div className="handoff-grid">
          {handoffSteps.map((step) => (
            <article className="step" key={step.kicker}>
              <p>{step.kicker}</p>
              <h3>{step.title}</h3>
              <span>{step.body}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="product-proof-section" aria-label="Live handoff board preview">
        <div className="product-proof-copy">
          <p className="eyebrow">Product proof</p>
          <h2>A live handoff board, built for checking receipts.</h2>
          <p>
            The owner can see what came in, what was urgent, and where the lead
            was delivered without asking the team to manage one more dispatch
            queue.
          </p>
        </div>
        <div className="handoff-log">
          <div className="handoff-log-header">
            <span>Live handoff board</span>
            <strong>Northside HVAC</strong>
          </div>
          <div className="handoff-log-metrics">
            <div>
              <strong>38</strong>
              <span>calls covered</span>
            </div>
            <div>
              <strong>12</strong>
              <span>qualified leads</span>
            </div>
            <div>
              <strong>0</strong>
              <span>escalation fees</span>
            </div>
          </div>
          <div className="handoff-log-table">
            {handoffRows.map(([time, issue, urgency, route]) => (
              <div className="handoff-log-row" key={`${time}-${issue}`}>
                <span>{time}</span>
                <strong>{issue}</strong>
                <em>{urgency}</em>
                <span>{route}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="integration-section">
        <div className="integration-visual" aria-hidden="true">
          <div className="signal-line" />
          <div className="signal-card main">Qualified lead</div>
          <div className="signal-card one">Owner email</div>
          <div className="signal-card two">Jobber</div>
          <div className="signal-card three">Webhook</div>
        </div>
        <div className="integration-copy">
          <p className="eyebrow">Integration-neutral by design</p>
          <h2>We hand off. We do not take over.</h2>
          <p>
            RequestHandoff is not another dispatch system. It captures the call
            and sends the structured record into the system your crew already
            checks every day.
          </p>
          <div className="logo-cloud" aria-label="Supported delivery destinations">
            {integrations.map((integration) => (
              <span key={integration}>{integration}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="vertical-section">
        <div className="vertical-copy">
          <p className="eyebrow">HVAC first, broader local services next</p>
          <h2>Specific enough to know when a call is urgent.</h2>
          <p>
            A system-down AC call with a vulnerable occupant should not be
            handled like a routine tune-up request. Escalation rules are defined
            by the business, logged, and followed exactly.
          </p>
        </div>
        <div className="rule-board">
          <div>
            <span>No cooling</span>
            <strong>Ask indoor temperature and occupants</strong>
          </div>
          <div>
            <span>After hours</span>
            <strong>Capture window or warm-transfer if urgent</strong>
          </div>
          <div>
            <span>Not served</span>
            <strong>Flag clearly instead of over-promising</strong>
          </div>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-heading">
          <p className="eyebrow">Flat-rate trust</p>
          <h2>No per-minute traps. No surprise escalation bill.</h2>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className="plan" key={plan.name}>
              <p>{plan.name}</p>
              <h3>
                {plan.price}
                <span>/mo</span>
              </h3>
              <span>{plan.detail}</span>
            </article>
          ))}
        </div>
        <p className="overage">Overage is $0.49 per answered call. Escalations are never a surcharge.</p>
      </section>

      <section className="demo-section" id="demo">
        <div>
          <p className="eyebrow">Demo from your website</p>
          <h2>Hear your own business answer before you switch anything.</h2>
          <p>
            We pre-load your services, hours, coverage area, and handoff rules
            from your public site, then correct the details together in one
            short call.
          </p>
          <ul className="demo-checklist">
            {setupItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <a className="primary-button" href="mailto:krish@requesthandoff.com">
          Request a demo
        </a>
      </section>
    </main>
  );
}
