import {
  assertSafeWebhookUrl,
  decryptWebhookSecret,
  encryptWebhookSecret,
  signWebhookBody,
} from "@requesthandoff/outbound-webhook";

export interface TenantWebhookSettingsRow {
  id: string;
  business_name: string;
  outbound_webhook_url: string | null;
  outbound_webhook_secret_ciphertext: string | null;
}

export interface WebhookSettingsUpdate {
  outbound_webhook_url: string | null;
  outbound_webhook_secret_ciphertext?: string | null;
  updated_at: string;
}

export function buildWebhookSettingsUpdate(args: {
  rawUrl: FormDataEntryValue | null;
  rawSecret: FormDataEntryValue | null;
  existingSecretCiphertext: string | null;
  clearSecret: boolean;
  nowIso?: string;
}): WebhookSettingsUpdate {
  const url = stringValue(args.rawUrl).trim();
  const secret = stringValue(args.rawSecret).trim();
  const update: WebhookSettingsUpdate = {
    outbound_webhook_url: null,
    updated_at: args.nowIso ?? new Date().toISOString(),
  };

  if (!url) {
    update.outbound_webhook_secret_ciphertext = null;
    return update;
  }

  if (url.length > 2048) {
    throw new Error("webhook_url_too_long");
  }
  assertSafeWebhookUrl(url);
  update.outbound_webhook_url = url;

  if (args.clearSecret) {
    update.outbound_webhook_secret_ciphertext = null;
  } else if (secret) {
    if (secret.length < 16) {
      throw new Error("webhook_secret_too_short");
    }
    update.outbound_webhook_secret_ciphertext = encryptWebhookSecret(secret);
  } else if (!args.existingSecretCiphertext) {
    update.outbound_webhook_secret_ciphertext = null;
  }

  return update;
}

export function renderWebhookTestRequest(args: {
  tenant: TenantWebhookSettingsRow;
  nowIso?: string;
}): { url: string; body: string; headers: Record<string, string> } {
  const url = args.tenant.outbound_webhook_url;
  if (!url) {
    throw new Error("webhook_url_not_configured");
  }
  assertSafeWebhookUrl(url);

  const now = args.nowIso ?? new Date().toISOString();
  const body = JSON.stringify({
    event: "lead.test",
    tenant: {
      id: args.tenant.id,
      business_name: args.tenant.business_name,
    },
    lead: {
      id: "test-delivery",
      status: "test",
      caller_name: "Test Caller",
      caller_phone: "+15125550100",
      service_category: "Webhook test",
      issue_description: "Founder admin test delivery from RequestHandoff.",
      urgency_level: "standard",
      recommended_action: "confirm_webhook_mapping",
      missing_information: [],
      created_at: now,
    },
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-RequestHandoff-Event": "lead.test",
    "X-RequestHandoff-Tenant-Id": args.tenant.id,
    "X-RequestHandoff-Lead-Id": "test-delivery",
    "X-RequestHandoff-Test": "true",
  };

  if (args.tenant.outbound_webhook_secret_ciphertext) {
    const secret = decryptWebhookSecret(args.tenant.outbound_webhook_secret_ciphertext);
    headers["X-RequestHandoff-Signature"] = signWebhookBody(secret, body);
  }

  return { url, body, headers };
}

function stringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}
