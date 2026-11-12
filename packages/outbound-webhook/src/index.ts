/**
 * Server-only helpers for the generic outbound webhook handoff path.
 *
 * Used by founder admin settings to validate/encrypt destinations, and by
 * post-call delivery to decrypt/sign payloads. Plaintext webhook secrets never
 * leave the current server process.
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP, type LookupFunction } from "node:net";

const CIPHERTEXT_VERSION = "v1";

export type WebhookHostnameLookup = (hostname: string) => Promise<string[]>;

export interface ResolvedWebhookTarget {
  url: URL;
  address: string;
  family: 4 | 6;
}

export interface WebhookPostRequestArgs {
  url: string;
  body: string;
  headers: Record<string, string>;
  timeoutMs?: number;
  hostnameLookup?: WebhookHostnameLookup;
}

export function assertSafeWebhookUrl(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw new Error("outbound webhook URL must use https");
  }

  const hostname = parsed.hostname.toLowerCase();
  const ipHostname = hostname.replace(/^\[/, "").replace(/\]$/, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("outbound webhook URL cannot target localhost or local hostnames");
  }

  const ipVersion = isIP(ipHostname);
  if (ipVersion === 4 && isUnsafeIpv4(ipHostname)) {
    throw new Error(
      "outbound webhook URL cannot target private, loopback, or link-local IPv4 ranges",
    );
  }
  if (ipVersion === 6 && isUnsafeIpv6(ipHostname)) {
    throw new Error(
      "outbound webhook URL cannot target private, loopback, or link-local IPv6 ranges",
    );
  }
}

export async function assertResolvedSafeWebhookUrl(
  url: string,
  hostnameLookup: WebhookHostnameLookup = defaultHostnameLookup,
): Promise<void> {
  await resolveSafeWebhookTarget(url, hostnameLookup);
}

export async function resolveSafeWebhookTarget(
  url: string,
  hostnameLookup: WebhookHostnameLookup = defaultHostnameLookup,
): Promise<ResolvedWebhookTarget> {
  assertSafeWebhookUrl(url);

  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  const ipHostname = hostname.replace(/^\[/, "").replace(/\]$/, "");
  const ipVersion = isIP(ipHostname);
  if (ipVersion) {
    return { url: parsed, address: ipHostname, family: ipVersion === 6 ? 6 : 4 };
  }

  const addresses = await hostnameLookup(hostname);
  if (addresses.length === 0) {
    throw new Error("outbound webhook URL hostname did not resolve");
  }

  for (const address of addresses) {
    assertSafeWebhookUrl(`https://${isIP(address) === 6 ? `[${address}]` : address}/`);
  }
  const address = addresses[0]!;
  const family = isIP(address);
  if (family !== 4 && family !== 6) {
    throw new Error("outbound webhook URL hostname resolved to an invalid IP address");
  }
  return { url: parsed, address, family };
}

export async function postWebhookRequest({
  url,
  body,
  headers,
  timeoutMs = 8_000,
  hostnameLookup = defaultHostnameLookup,
}: WebhookPostRequestArgs): Promise<{ status: number; text: string }> {
  const target = await resolveSafeWebhookTarget(url, hostnameLookup);
  const lookupPinnedAddress: LookupFunction = (_hostname, _options, callback) => {
    callback(null, target.address, target.family);
  };

  return new Promise((resolve, reject) => {
    const request = httpsRequest(
      {
        protocol: "https:",
        hostname: stripIpv6Brackets(target.url.hostname),
        port: target.url.port ? Number(target.url.port) : 443,
        path: `${target.url.pathname}${target.url.search}`,
        method: "POST",
        headers,
        lookup: lookupPinnedAddress,
        timeout: timeoutMs,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            text: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    request.on("timeout", () => {
      request.destroy(new Error("outbound webhook request timed out"));
    });
    request.on("error", reject);
    request.end(body);
  });
}

export function encryptWebhookSecret(secret: string, keyBase64 = requireWebhookSecretKey()): string {
  const keyBytes = decodeWebhookSecretKey(keyBase64);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    CIPHERTEXT_VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptWebhookSecret(
  ciphertext: string,
  keyBase64 = requireWebhookSecretKey(),
): string {
  const keyBytes = decodeWebhookSecretKey(keyBase64);
  const [version, ivBase64, tagBase64, encryptedBase64] = ciphertext.split(":");
  if (version !== CIPHERTEXT_VERSION || !ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error("Unsupported outbound webhook secret ciphertext format");
  }

  const decipher = createDecipheriv("aes-256-gcm", keyBytes, Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function signWebhookBody(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

function requireWebhookSecretKey(): string {
  const key = process.env["OUTBOUND_WEBHOOK_SECRET_ENCRYPTION_KEY"];
  if (!key) {
    throw new Error(
      "OUTBOUND_WEBHOOK_SECRET_ENCRYPTION_KEY is required for outbound webhook secrets",
    );
  }
  return key;
}

function decodeWebhookSecretKey(keyBase64: string): Buffer {
  const keyBytes = Buffer.from(keyBase64, "base64");
  if (keyBytes.length !== 32) {
    throw new Error("OUTBOUND_WEBHOOK_SECRET_ENCRYPTION_KEY must be 32 bytes base64-encoded");
  }
  return keyBytes;
}

function isUnsafeIpv4(hostname: string): boolean {
  const [a = 0, b = 0] = hostname.split(".").map((part) => Number(part));
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isUnsafeIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  const mappedIpv4 = ipv4FromMappedIpv6(normalized);
  if (mappedIpv4) {
    return isUnsafeIpv4(mappedIpv4);
  }
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function ipv4FromMappedIpv6(hostname: string): string | null {
  if (!hostname.startsWith("::ffff:")) return null;
  const tail = hostname.slice("::ffff:".length);
  if (isIP(tail) === 4) return tail;

  const parts = tail.split(":");
  if (parts.length !== 2) return null;
  const high = Number.parseInt(parts[0] ?? "", 16);
  const low = Number.parseInt(parts[1] ?? "", 16);
  if (!Number.isInteger(high) || !Number.isInteger(low) || high < 0 || high > 0xffff || low < 0 || low > 0xffff) {
    return null;
  }
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
}

async function defaultHostnameLookup(hostname: string): Promise<string[]> {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((result) => result.address);
}

function stripIpv6Brackets(hostname: string): string {
  return hostname.replace(/^\[/, "").replace(/\]$/, "");
}
