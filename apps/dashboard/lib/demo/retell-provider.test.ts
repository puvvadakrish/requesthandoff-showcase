import { describe, expect, it } from "vitest";

import { buildGeneralDemoConfig } from "@requesthandoff/schema";

import { buildRetellDynamicVariables, createDemoWebCall } from "./retell-provider";

describe("Retell demo provider", () => {
  const config = buildGeneralDemoConfig({
    businessName: "Demo Fitness Austin",
    websiteUrl: "https://example.com",
    servicesOffered: ["open gym access", "personal training", "gym tours"],
    servicesNotOffered: ["medical advice", "billing changes"],
    serviceArea: "Austin, TX",
    hoursSummary: "Monday-Friday 8am-5pm",
    handoffDestination: "email",
  });

  it("formats all dynamic variables as strings", () => {
    const variables = buildRetellDynamicVariables(config);

    expect(variables).toMatchObject({
      business_name: "Demo Fitness Austin",
      services_offered: "open gym access, personal training, gym tours",
      services_not_offered: "medical advice, billing changes",
      service_area: "Austin, TX",
      handoff_destination: "Email structured lead summary",
    });
    expect(Object.values(variables).every((value) => typeof value === "string")).toBe(true);
  });

  it("creates a Retell web call with demo metadata and dynamic variables", async () => {
    const fetcher = async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.agent_id).toBe("agent_test");
      expect(body.metadata).toMatchObject({
        demo_id: "demo-austin-auto-glass",
        prospect_business_name: "Demo Fitness Austin",
        requesthandoff_surface: "public_demo",
      });
      expect(body.retell_llm_dynamic_variables.business_name).toBe("Demo Fitness Austin");

      return new Response(
        JSON.stringify({
          call_type: "web_call",
          access_token: "access_test",
          call_id: "call_test",
          agent_id: "agent_test",
          agent_version: 1,
          call_status: "registered",
        }),
        { status: 201 },
      );
    };

    await expect(
      createDemoWebCall({
        demoId: "demo-austin-auto-glass",
        prospectBusinessName: "Demo Fitness Austin",
        extractedConfig: config,
        apiKey: "key_test",
        agentId: "agent_test",
        fetcher,
      }),
    ).resolves.toMatchObject({
      access_token: "access_test",
      call_id: "call_test",
      call_type: "web_call",
    });
  });

  it("falls back to a safe general config when stored demo config is incomplete", async () => {
    const fetcher = async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.retell_llm_dynamic_variables.business_name).toBe("Fallback Demo");
      expect(body.retell_llm_dynamic_variables.services_offered).toBe("general requests");
      expect(body.retell_llm_dynamic_variables.safety_boundaries).toContain("no_booking");

      return new Response(
        JSON.stringify({
          call_type: "web_call",
          access_token: "access_test",
          call_id: "call_test",
          agent_id: "agent_test",
          agent_version: 1,
          call_status: "registered",
        }),
        { status: 201 },
      );
    };

    await expect(
      createDemoWebCall({
        demoId: "fallback-demo",
        prospectBusinessName: "Fallback Demo",
        extractedConfig: { business_name: "Fallback Demo" },
        apiKey: "key_test",
        agentId: "agent_test",
        fetcher,
      }),
    ).resolves.toMatchObject({
      access_token: "access_test",
      call_id: "call_test",
    });
  });
});
