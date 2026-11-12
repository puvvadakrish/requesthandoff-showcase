import { buildGeneralDemoConfig, DemoConfigSchema, type DemoConfig } from "@requesthandoff/schema";

const RETELL_CREATE_WEB_CALL_URL = "https://api.retellai.com/v2/create-web-call";

export interface RetellWebCall {
  access_token: string;
  call_id: string;
  agent_id: string;
  agent_version: number;
  call_status: string;
  call_type: "web_call";
}

export interface CreateDemoWebCallArgs {
  demoId: string;
  prospectBusinessName: string;
  extractedConfig: unknown;
  apiKey?: string;
  agentId?: string;
  fetcher?: typeof fetch;
}

export async function createDemoWebCall({
  demoId,
  prospectBusinessName,
  extractedConfig,
  apiKey = process.env["RETELL_API_KEY"],
  agentId = process.env["RETELL_DEMO_AGENT_ID"],
  fetcher = fetch,
}: CreateDemoWebCallArgs): Promise<RetellWebCall> {
  if (!apiKey) throw new Error("RETELL_API_KEY is required");
  if (!agentId) throw new Error("RETELL_DEMO_AGENT_ID is required");

  const demoConfig = demoConfigForWebCall(extractedConfig, prospectBusinessName);
  const response = await fetcher(RETELL_CREATE_WEB_CALL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: agentId,
      metadata: {
        demo_id: demoId,
        prospect_business_name: prospectBusinessName,
        requesthandoff_surface: "public_demo",
      },
      retell_llm_dynamic_variables: buildRetellDynamicVariables(demoConfig),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Retell create-web-call failed with ${response.status}${body ? `: ${body}` : ""}`,
    );
  }

  const payload = (await response.json()) as Partial<RetellWebCall>;
  if (
    payload.call_type !== "web_call" ||
    !payload.access_token ||
    !payload.call_id ||
    !payload.agent_id ||
    typeof payload.agent_version !== "number" ||
    !payload.call_status
  ) {
    throw new Error("Retell create-web-call returned an invalid response");
  }

  return payload as RetellWebCall;
}

function demoConfigForWebCall(extractedConfig: unknown, prospectBusinessName: string): DemoConfig {
  const parsedConfig = DemoConfigSchema.safeParse(extractedConfig);
  if (parsedConfig.success) return parsedConfig.data;

  return buildGeneralDemoConfig({
    businessName: prospectBusinessName,
    servicesOffered: ["general requests"],
    serviceArea: "Correction needed",
    correctionNeeded: ["demo config"],
    handoffDestination: "email",
    notes: "Fallback generated because the saved demo config was incomplete.",
  });
}

export function buildRetellDynamicVariables(config: DemoConfig): Record<string, string> {
  return {
    business_name: config.business_name,
    greeting: config.greeting,
    services_offered: config.services_offered.join(", "),
    services_not_offered: config.services_not_offered.length
      ? config.services_not_offered.join(", ")
      : "No exclusions listed by founder review.",
    service_area: config.service_area,
    hours_summary: config.hours_summary || "Hours need founder confirmation.",
    urgency_rules: config.urgency_rules.length
      ? config.urgency_rules.join(" | ")
      : "Capture urgency and flag missing details for owner review.",
    intake_fields: config.intake_fields.join(", "),
    safety_boundaries: config.safety_boundaries.join(", "),
    handoff_destination: handoffDestinationLabel(config.handoff_destination),
    notes: config.notes || "No additional notes.",
  };
}

function handoffDestinationLabel(destination: DemoConfig["handoff_destination"]): string {
  switch (destination) {
    case "email":
      return "Email structured lead summary";
    case "webhook":
      return "Webhook or automation handoff";
    case "phone_review":
      return "Founder/owner review before handoff";
    case "unknown":
      return "Owner review before routing";
  }
}
