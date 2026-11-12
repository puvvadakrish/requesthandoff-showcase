/**
 * /admin/extractor — pre-demo profile extractor (plan U22).
 *
 * Founder pastes website URL + optional GBP link. Backend runs Gemini 3 Flash
 * extraction, returns a tenant config draft with PER-FIELD CONFIDENCE scores
 * (round 1 finding #13). Founder reviews + clicks "Approve for outreach"
 * (round 3 ADV-R3-2 pre-flight gate) which generates a public /demo/<id> URL.
 *
 * The extraction call itself lives in /api/admin/extract (route handler).
 * This page is the form UI + draft review.
 */
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pre-demo extractor | Founder admin" };

export default function ExtractorPage() {
  return (
    <section style={{ maxWidth: "60rem" }}>
      <p
        style={{
          color: "var(--accent)",
          fontSize: "0.78rem",
          fontWeight: 850,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "0.4rem",
        }}
      >
        Pre-demo extractor
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", lineHeight: 0.95, marginBottom: "0.6rem" }}>
        Build a demo from a prospect&apos;s website.
      </h1>
      <p style={{ color: "rgba(237, 243, 234, 0.62)", fontSize: "1.05rem", maxWidth: "44rem", marginBottom: "2rem" }}>
        Paste a website URL and (optionally) a Google Business Profile URL. The extractor returns
        a draft tenant config with confidence scores per field. Below-threshold fields stay blank
        until you confirm. After you approve, a shareable /demo/&lt;id&gt; URL is generated.
      </p>

      <form
        action="/api/admin/extract"
        method="post"
        style={{
          background: "rgba(237, 243, 234, 0.04)",
          border: "1px solid rgba(237, 243, 234, 0.12)",
          borderRadius: "var(--rh-radius-sm)",
          padding: "1.6rem",
        }}
      >
        <label htmlFor="website" style={{ fontSize: "0.92rem", fontWeight: 700 }}>
          Website URL
        </label>
        <input
          id="website"
          name="website_url"
          type="url"
          required
          placeholder="https://acme-hvac.com"
          style={{
            width: "100%",
            marginTop: "0.4rem",
            marginBottom: "1.2rem",
            padding: "0.7rem 0.9rem",
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(237, 243, 234, 0.2)",
            borderRadius: "var(--rh-radius-sm)",
            color: "#edf3ea",
            fontFamily: "inherit",
          }}
        />

        <label htmlFor="gbp" style={{ fontSize: "0.92rem", fontWeight: 700 }}>
          Google Business Profile URL <span style={{ color: "rgba(237, 243, 234, 0.5)" }}>(optional)</span>
        </label>
        <input
          id="gbp"
          name="gbp_url"
          type="url"
          placeholder="https://maps.google.com/..."
          style={{
            width: "100%",
            marginTop: "0.4rem",
            marginBottom: "1.2rem",
            padding: "0.7rem 0.9rem",
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(237, 243, 234, 0.2)",
            borderRadius: "var(--rh-radius-sm)",
            color: "#edf3ea",
            fontFamily: "inherit",
          }}
        />

        <button
          type="submit"
          style={{
            background: "var(--accent)",
            border: "none",
            borderRadius: "999px",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 800,
            padding: "0.85rem 1.4rem",
          }}
        >
          Extract draft
        </button>
      </form>

      <p
        style={{
          color: "rgba(237, 243, 234, 0.5)",
          fontSize: "0.84rem",
          marginTop: "1.2rem",
        }}
      >
        Demo URLs include a session cap, per-IP rate limit, optional Cloudflare Turnstile for broad
        sends, and a Retell-spend circuit-breaker. See plan U22 abuse protection.
      </p>
    </section>
  );
}
