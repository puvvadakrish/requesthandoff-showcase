import { Buffer } from "node:buffer";
import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  assertSafeWebhookUrl,
  assertResolvedSafeWebhookUrl,
  decryptWebhookSecret,
  encryptWebhookSecret,
  postWebhookRequest,
  resolveSafeWebhookTarget,
  signWebhookBody,
} from "./index.js";

const key = Buffer.alloc(32, 7).toString("base64");

describe("webhook URL safety", () => {
  it.each([
    "http://hooks.example.com/requesthandoff",
    "https://localhost/requesthandoff",
    "https://2130706433/requesthandoff",
    "https://0x7f000001/requesthandoff",
    "https://192.168.1.10/requesthandoff",
    "https://10.0.0.10/requesthandoff",
    "https://169.254.169.254/latest/meta-data",
    "https://[::]/requesthandoff",
    "https://[::1]/requesthandoff",
    "https://[::ffff:127.0.0.1]/requesthandoff",
  ])("rejects unsafe URL %s", (url) => {
    expect(() => assertSafeWebhookUrl(url)).toThrow();
  });

  it("allows normal HTTPS public hostnames", () => {
    expect(() => assertSafeWebhookUrl("https://hooks.example.com/requesthandoff")).not.toThrow();
  });
});

describe("resolved webhook URL safety", () => {
  it("rejects hostnames that resolve to private IPs", async () => {
    await expect(
      assertResolvedSafeWebhookUrl("https://hooks.example.com/requesthandoff", async () => [
        "10.0.0.12",
      ]),
    ).rejects.toThrow("private, loopback, or link-local");
  });

  it("allows hostnames that resolve to public IPs", async () => {
    await expect(
      assertResolvedSafeWebhookUrl("https://hooks.example.com/requesthandoff", async () => [
        "93.184.216.34",
      ]),
    ).resolves.toBeUndefined();
  });

  it("returns the validated address used by the pinned request path", async () => {
    const target = await resolveSafeWebhookTarget(
      "https://hooks.example.com/requesthandoff",
      async () => ["93.184.216.34"],
    );

    expect(target).toMatchObject({
      address: "93.184.216.34",
      family: 4,
    });
    expect(target.url.hostname).toBe("hooks.example.com");
  });
});

describe("postWebhookRequest", () => {
  it("rejects unsafe resolved hostnames before opening a request", async () => {
    await expect(
      postWebhookRequest({
        url: "https://hooks.example.com/requesthandoff",
        body: "{}",
        headers: { "Content-Type": "application/json" },
        hostnameLookup: async () => ["127.0.0.1"],
      }),
    ).rejects.toThrow("private, loopback, or link-local");
  });
});

describe("webhook secret encryption", () => {
  it("round-trips a secret without returning plaintext ciphertext", () => {
    const ciphertext = encryptWebhookSecret("test-webhook-secret-at-least-16", key);

    expect(ciphertext).toMatch(/^v1:/);
    expect(ciphertext).not.toContain("test-webhook-secret");
    expect(decryptWebhookSecret(ciphertext, key)).toBe("test-webhook-secret-at-least-16");
  });

  it("rejects malformed keys", () => {
    expect(() => encryptWebhookSecret("test-webhook-secret-at-least-16", "bad")).toThrow(
      "32 bytes",
    );
  });
});

describe("signWebhookBody", () => {
  it("renders RequestHandoff HMAC signatures", () => {
    expect(signWebhookBody("secret", "{\"event\":\"lead.test\"}")).toBe(
      `sha256=${createHmac("sha256", "secret").update("{\"event\":\"lead.test\"}").digest("hex")}`,
    );
  });
});
