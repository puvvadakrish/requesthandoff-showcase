import { Hono } from "hono";
import { postWebhookRequest } from "@requesthandoff/outbound-webhook";

import type { EmailClient } from "./delivery/email.js";
import type { WebhookHttpClient } from "./delivery/webhook-url.js";
import type { GeminiClient } from "./extract/gemini.js";
import {
  RetellCallEndedPayloadSchema,
  handleRetellCallEnded,
  type PostCallPipelineDeps,
} from "./pipeline/call-ended.js";
import { SupabasePostCallStorage } from "./storage/supabase.js";

const INTERNAL_SECRET_HEADER = "x-requesthandoff-worker-secret";

export interface PostCallAppDeps extends PostCallPipelineDeps {
  webhookSecret?: string;
}

export function buildPostCallApp(deps: PostCallAppDeps): Hono {
  const app = new Hono();
  const webhookSecret = normalizeOptionalSecret(deps.webhookSecret);

  app.get("/health", (c) => c.json({ status: "ok", worker: "post-call" }));

  app.post("/calls/ended", async (c) => {
    if (webhookSecret) {
      const provided = c.req.header(INTERNAL_SECRET_HEADER);
      if (provided !== webhookSecret) {
        return c.json({ error: "unauthorized" }, 401);
      }
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "bad_json" }, 400);
    }

    const parsed = RetellCallEndedPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "bad_payload", issues: parsed.error.issues }, 400);
    }

    const result = await handleRetellCallEnded(parsed.data, deps);
    switch (result.status) {
      case "unknown_agent":
        return c.json(result, 404);
      case "tenant_not_found":
        return c.json(result, 404);
      case "missing_transcript":
      case "manual_review":
        return c.json(result, 202);
      default:
        return c.json(result);
    }
  });

  return app;
}

export function buildPostCallAppFromEnv(): Hono {
  const webhookSecret = requiredEnv("POST_CALL_WEBHOOK_SECRET");
  const emailFromAddress =
    process.env["POST_CALL_EMAIL_FROM"] ??
    process.env["RESEND_FROM_EMAIL"] ??
    "RequestHandoff <leads@requesthandoff.com>";
  return buildPostCallApp({
    webhookSecret,
    storage: new SupabasePostCallStorage(),
    geminiClient: createGeminiClientFromEnv(),
    emailClient: createEmailClientFromEnv(),
    webhookClient: createFetchWebhookClient(),
    emailFromAddress,
  });
}

export function createEmailClientFromEnv(): EmailClient {
  const provider = (process.env["POST_CALL_EMAIL_PROVIDER"] ?? "resend").toLowerCase();
  switch (provider) {
    case "resend":
      return createResendEmailClientFromEnv();
    case "brevo":
      return createBrevoEmailClientFromEnv();
    default:
      throw new Error(`Unsupported POST_CALL_EMAIL_PROVIDER: ${provider}`);
  }
}

function createResendEmailClientFromEnv(): EmailClient {
  const apiKey = requiredEnv("RESEND_API_KEY");
  return {
    async send(args) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: args.from,
          to: [args.to],
          subject: args.subject,
          html: args.html,
          text: args.text,
          headers: args.headers,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!response.ok) {
        throw new Error(json.message ?? `Resend request failed with ${response.status}`);
      }
      if (!json.id) {
        throw new Error("Resend response missing id");
      }
      return { id: json.id };
    },
  };
}

function createBrevoEmailClientFromEnv(): EmailClient {
  const apiKey = requiredEnv("BREVO_API_KEY");
  return {
    async send(args) {
      const sender = parseEmailAddress(args.from);
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: args.to }],
          subject: args.subject,
          htmlContent: args.html,
          textContent: args.text,
          headers: args.headers,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        id?: string;
        messageId?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(json.message ?? `Brevo request failed with ${response.status}`);
      }
      const id = json.messageId ?? json.id;
      if (!id) {
        throw new Error("Brevo response missing messageId");
      }
      return { id };
    },
  };
}

function parseEmailAddress(value: string): { email: string; name?: string } {
  const match = value.match(/^\s*(?<name>.*?)\s*<(?<email>[^>]+)>\s*$/);
  if (!match?.groups) {
    return { email: value.trim() };
  }
  const name = match.groups["name"]?.trim();
  return {
    email: match.groups["email"]?.trim() ?? value.trim(),
    ...(name ? { name } : {}),
  };
}

export function createGeminiClientFromEnv(): GeminiClient {
  if (process.env["GOOGLE_GENAI_API_KEY"]?.trim()) {
    return createGoogleGenaiClientFromEnv();
  }
  return createVertexGeminiClientFromEnv();
}

function createVertexGeminiClientFromEnv(): GeminiClient {
  const project = requiredEnv("GOOGLE_CLOUD_PROJECT", "VERTEX_AI_PROJECT_ID");
  const location =
    process.env["GOOGLE_CLOUD_LOCATION"] ?? process.env["VERTEX_AI_LOCATION"] ?? "us-central1";
  const googleAuthOptions = parseGoogleAuthOptionsFromEnv();
  const modelOverride = process.env["GEMINI_MODEL_ID"]?.trim();

  return {
    async generate(args) {
      const { VertexAI } = await import("@google-cloud/vertexai");
      const vertex = new VertexAI({
        project,
        location,
        ...(googleAuthOptions ? { googleAuthOptions } : {}),
      });
      const model = vertex.getGenerativeModel({
        model: modelOverride || args.model,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: args.responseSchema,
        },
      });
      const fewShotText = args.fewShotExamples
        .map(
          (example, index) =>
            `Example ${index + 1} transcript:\n${example.transcript}\nExample ${index + 1} extraction:\n${JSON.stringify(
              example.extraction,
            )}`,
        )
        .join("\n\n");
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  args.systemPrompt,
                  `Cache key: ${args.cacheKey}`,
                  fewShotText,
                  args.userMessage,
                ].join("\n\n"),
              },
            ],
          },
        ],
      });
      const response = result.response as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          cachedContentTokenCount?: number;
        };
      };
      const text =
        response.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim() ?? "";

      return {
        text,
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        cachedTokens: response.usageMetadata?.cachedContentTokenCount ?? 0,
      };
    },
  };
}

function createGoogleGenaiClientFromEnv(): GeminiClient {
  const apiKey = requiredEnv("GOOGLE_GENAI_API_KEY");
  const modelOverride = process.env["GEMINI_MODEL_ID"]?.trim();
  const fallbackModel = process.env["GEMINI_FALLBACK_MODEL_ID"]?.trim();
  return {
    async generate(args) {
      const model = modelOverride || args.model;
      const models = [model, ...(fallbackModel && fallbackModel !== model ? [fallbackModel] : [])];
      const fewShotText = args.fewShotExamples
        .map(
          (example, index) =>
            `Example ${index + 1} transcript:\n${example.transcript}\nExample ${index + 1} extraction:\n${JSON.stringify(
              example.extraction,
            )}`,
        )
        .join("\n\n");
      let lastError: Error | null = null;
      for (const currentModel of models) {
        try {
          return await generateWithGoogleGenaiApi({
            apiKey,
            model: currentModel,
            fewShotText,
            args,
          });
        } catch (error) {
          lastError = error as Error;
          if (currentModel === models[models.length - 1] || !isTransientGeminiError(lastError)) {
            throw lastError;
          }
        }
      }
      throw lastError ?? new Error("Gemini API request failed");
    },
  };
}

async function generateWithGoogleGenaiApi({
  apiKey,
  model,
  fewShotText,
  args,
}: {
  apiKey: string;
  model: string;
  fewShotText: string;
  args: Parameters<GeminiClient["generate"]>[0];
}) {
  const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model,
        )}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: [
                      args.systemPrompt,
                      `Cache key: ${args.cacheKey}`,
                      fewShotText,
                      args.userMessage,
                    ].join("\n\n"),
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: normalizeSchemaForGeminiApi(args.responseSchema),
            },
          }),
        },
      );
  const json = (await response.json().catch(() => ({}))) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          cachedContentTokenCount?: number;
        };
        error?: { message?: string };
      };
  if (!response.ok) {
    throw new Error(json.error?.message ?? `Gemini API request failed with ${response.status}`);
  }
  const text =
        json.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim() ?? "";

  return {
        text,
        inputTokens: json.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
        cachedTokens: json.usageMetadata?.cachedContentTokenCount ?? 0,
      };
}

function isTransientGeminiError(error: Error): boolean {
  return /high demand|try again later|temporar|429|500|502|503|504/i.test(error.message);
}

function normalizeSchemaForGeminiApi(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map((item) => normalizeSchemaForGeminiApi(item));
  if (!schema || typeof schema !== "object") return schema;

  const input = schema as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "type" && Array.isArray(value)) {
      const nonNullTypes = value.filter((item) => item !== "null");
      if (nonNullTypes.length === 1) {
        output["type"] = nonNullTypes[0];
        output["nullable"] = true;
        continue;
      }
    }
    output[key] = normalizeSchemaForGeminiApi(value);
  }
  return output;
}

export function parseGoogleAuthOptionsFromEnv():
  | { credentials: Record<string, unknown> }
  | undefined {
  const raw = process.env["GOOGLE_APPLICATION_CREDENTIALS_JSON"]?.trim();
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON must be a service account JSON object");
  }
  const credentials = parsed as Record<string, unknown>;
  if (
    typeof credentials["client_email"] !== "string" ||
    typeof credentials["private_key"] !== "string"
  ) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON missing client_email or private_key");
  }
  return { credentials };
}

function createFetchWebhookClient(): WebhookHttpClient {
  return {
    async post(args) {
      const response = await postWebhookRequest({
        url: args.url,
        body: args.body,
        headers: args.headers,
        timeoutMs: 8_000,
      });
      return {
        status: response.status,
        text: response.text,
      };
    },
  };
}

function requiredEnv(name: string, fallbackName?: string): string {
  const value =
    process.env[name]?.trim() ?? (fallbackName ? process.env[fallbackName]?.trim() : undefined);
  if (!value) throw new Error(`${fallbackName ? `${name} or ${fallbackName}` : name} is required`);
  return value;
}

function normalizeOptionalSecret(secret: string | undefined): string | undefined {
  if (secret === undefined) return undefined;
  const trimmed = secret.trim();
  if (!trimmed) throw new Error("webhookSecret cannot be blank");
  return trimmed;
}
