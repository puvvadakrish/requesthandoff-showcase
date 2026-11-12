import { Buffer } from "node:buffer";

import { decryptWebhookSecret, encryptWebhookSecret } from "@requesthandoff/outbound-webhook";
import { describe, expect, it, vi } from "vitest";

import { buildWebhookSettingsUpdate, renderWebhookTestRequest } from "./settings";

const key = Buffer.alloc(32, 9).toString("base64");

describe("buildWebhookSettingsUpdate", () => {
  it("disables webhook delivery and clears stored secret when URL is blank", () => {
    const form = new FormData();
    form.set("outbound_webhook_url", " ");
    form.set("outbound_webhook_secret", "ignored-secret-value");

    const update = buildWebhookSettingsUpdate({
      rawUrl: form.get("outbound_webhook_url"),
      rawSecret: form.get("outbound_webhook_secret"),
      existingSecretCiphertext: "v1:old",
      clearSecret: false,
      nowIso: "2026-06-02T12:00:00.000Z",
    });

    expect(update).toEqual({
      outbound_webhook_url: null,
      outbound_webhook_secret_ciphertext: null,
      updated_at: "2026-06-02T12:00:00.000Z",
    });
  });

  it("encrypts a new secret before storing it", () => {
    vi.stubEnv("OUTBOUND_WEBHOOK_SECRET_ENCRYPTION_KEY", key);
    const form = new FormData();
    form.set("outbound_webhook_url", "https://hooks.example.com/requesthandoff");
    form.set("outbound_webhook_secret", "test-webhook-secret-at-least-16");

    const update = buildWebhookSettingsUpdate({
      rawUrl: form.get("outbound_webhook_url"),
      rawSecret: form.get("outbound_webhook_secret"),
      existingSecretCiphertext: null,
      clearSecret: false,
      nowIso: "2026-06-02T12:00:00.000Z",
    });

    expect(update.outbound_webhook_url).toBe("https://hooks.example.com/requesthandoff");
    expect(update.outbound_webhook_secret_ciphertext).toMatch(/^v1:/);
    expect(update.outbound_webhook_secret_ciphertext).not.toContain("test-webhook-secret");
    expect(decryptWebhookSecret(update.outbound_webhook_secret_ciphertext!, key)).toBe(
      "test-webhook-secret-at-least-16",
    );
  });

  it("keeps an existing secret when the secret field is left blank", () => {
    const form = new FormData();
    form.set("outbound_webhook_url", "https://hooks.example.com/requesthandoff");
    form.set("outbound_webhook_secret", "");

    const update = buildWebhookSettingsUpdate({
      rawUrl: form.get("outbound_webhook_url"),
      rawSecret: form.get("outbound_webhook_secret"),
      existingSecretCiphertext: "v1:existing",
      clearSecret: false,
      nowIso: "2026-06-02T12:00:00.000Z",
    });

    expect(update).toEqual({
      outbound_webhook_url: "https://hooks.example.com/requesthandoff",
      updated_at: "2026-06-02T12:00:00.000Z",
    });
  });

  it("rejects unsafe URLs before saving", () => {
    const form = new FormData();
    form.set("outbound_webhook_url", "https://127.0.0.1/hook");

    expect(() =>
      buildWebhookSettingsUpdate({
        rawUrl: form.get("outbound_webhook_url"),
        rawSecret: null,
        existingSecretCiphertext: null,
        clearSecret: false,
      }),
    ).toThrow("private, loopback, or link-local");
  });
});

describe("renderWebhookTestRequest", () => {
  it("renders a structured test lead and signs it when a secret exists", () => {
    vi.stubEnv("OUTBOUND_WEBHOOK_SECRET_ENCRYPTION_KEY", key);
    const request = renderWebhookTestRequest({
      tenant: {
        id: "11111111-1111-4111-8111-111111111111",
        business_name: "Austin HVAC Co",
        outbound_webhook_url: "https://hooks.example.com/requesthandoff",
        outbound_webhook_secret_ciphertext: encryptWebhookSecret(
          "test-webhook-secret-at-least-16",
          key,
        ),
      },
      nowIso: "2026-06-02T12:00:00.000Z",
    });

    expect(request.url).toBe("https://hooks.example.com/requesthandoff");
    expect(JSON.parse(request.body)).toMatchObject({
      event: "lead.test",
      tenant: { business_name: "Austin HVAC Co" },
      lead: { id: "test-delivery", status: "test", service_category: "Webhook test" },
    });
    expect(request.headers["X-RequestHandoff-Test"]).toBe("true");
    expect(request.headers["X-RequestHandoff-Signature"]).toMatch(/^sha256=/);
  });
});
