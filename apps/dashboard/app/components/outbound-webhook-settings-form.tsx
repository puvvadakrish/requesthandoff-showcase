interface OutboundWebhookSettingsFormProps {
  webhookUrl: string | null;
  hasSecret: boolean;
  canTest: boolean;
  saveAction: (formData: FormData) => void | Promise<void>;
  testAction: () => void | Promise<void>;
  saved: boolean;
  tested: boolean;
  savedLabel: string;
  testedLabel: string;
  urlLabel: string;
  urlHelp: string;
  saveButtonLabel: string;
  primaryButtonBackground: string;
  primaryButtonColor: string;
}

export function OutboundWebhookSettingsForm({
  webhookUrl,
  hasSecret,
  canTest,
  saveAction,
  testAction,
  saved,
  tested,
  savedLabel,
  testedLabel,
  urlLabel,
  urlHelp,
  saveButtonLabel,
  primaryButtonBackground,
  primaryButtonColor,
}: OutboundWebhookSettingsFormProps) {
  return (
    <>
      {saved ? <StatusNotice label={savedLabel} /> : null}
      {tested ? <StatusNotice label={testedLabel} /> : null}

      <div
        style={{
          background: "rgba(237, 243, 234, 0.04)",
          border: "1px solid rgba(237, 243, 234, 0.12)",
          borderRadius: "var(--rh-radius-sm)",
          padding: "1.2rem",
        }}
      >
        <form action={saveAction}>
          <label style={labelStyle} htmlFor="outbound_webhook_url">
            {urlLabel}
          </label>
          <input
            id="outbound_webhook_url"
            name="outbound_webhook_url"
            defaultValue={webhookUrl ?? ""}
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            style={inputStyle}
            type="url"
          />
          <p style={helpStyle}>{urlHelp}</p>

          <label style={{ ...labelStyle, marginTop: "1.1rem" }} htmlFor="outbound_webhook_secret">
            Signing secret
          </label>
          <input
            autoComplete="new-password"
            id="outbound_webhook_secret"
            name="outbound_webhook_secret"
            placeholder={hasSecret ? "Leave blank to keep current secret" : "Optional"}
            style={inputStyle}
            type="password"
          />
          <p style={helpStyle}>
            {hasSecret
              ? "A secret is configured. Enter a new one to rotate it, or leave blank to keep it."
              : "Optional HMAC signing secret. New secrets are encrypted before storage."}
          </p>

          {hasSecret ? (
            <label
              style={{
                alignItems: "center",
                color: "rgba(237, 243, 234, 0.7)",
                display: "flex",
                gap: "0.55rem",
                marginTop: "1rem",
              }}
            >
              <input name="clear_outbound_webhook_secret" type="checkbox" />
              Clear existing signing secret
            </label>
          ) : null}

          <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.4rem" }}>
            <button
              style={primaryButtonStyle(primaryButtonBackground, primaryButtonColor)}
              type="submit"
            >
              {saveButtonLabel}
            </button>
          </div>
        </form>

        <form action={testAction} style={{ marginTop: "1rem" }}>
          <button disabled={!canTest} style={secondaryButtonStyle(canTest)} type="submit">
            Send test delivery
          </button>
          {!canTest ? <p style={helpStyle}>Save a webhook URL before sending a test payload.</p> : null}
        </form>
      </div>
    </>
  );
}

function StatusNotice({ label }: { label: string }) {
  return (
    <div
      style={{
        background: "rgba(74, 112, 88, 0.22)",
        border: "1px solid rgba(74, 112, 88, 0.55)",
        borderRadius: "var(--rh-radius-sm)",
        color: "#edf3ea",
        marginBottom: "1rem",
        padding: "0.85rem 1rem",
      }}
    >
      {label}
    </div>
  );
}

const labelStyle = {
  color: "#edf3ea",
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 850,
  letterSpacing: "0.08em",
  marginBottom: "0.45rem",
  textTransform: "uppercase" as const,
};

const inputStyle = {
  background: "rgba(15, 20, 19, 0.82)",
  border: "1px solid rgba(237, 243, 234, 0.18)",
  borderRadius: "var(--rh-radius-sm)",
  color: "#edf3ea",
  font: "inherit",
  padding: "0.85rem 0.95rem",
  width: "100%",
};

const helpStyle = {
  color: "rgba(237, 243, 234, 0.58)",
  fontSize: "0.9rem",
  marginTop: "0.45rem",
};

function primaryButtonStyle(background: string, color: string) {
  return {
    background,
    border: "0",
    borderRadius: "var(--rh-radius-sm)",
    color,
    cursor: "pointer",
    fontWeight: 850,
    padding: "0.85rem 1rem",
  };
}

function secondaryButtonStyle(enabled: boolean) {
  return {
    background: "transparent",
    border: "1px solid rgba(237, 243, 234, 0.22)",
    borderRadius: "var(--rh-radius-sm)",
    color: enabled ? "#edf3ea" : "rgba(237, 243, 234, 0.38)",
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: 800,
    padding: "0.8rem 1rem",
  };
}
