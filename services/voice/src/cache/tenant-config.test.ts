import { beforeEach, describe, expect, it, vi } from "vitest";

import { TenantConfigCache, type TenantConfigLoader } from "./tenant-config.js";

const sampleTenant = {
  id: "11111111-1111-1111-1111-111111111111",
  business_name: "Austin HVAC",
  vertical: "hvac" as const,
  secondary_services: [],
  primary_state: "TX",
  plan: "starter" as const,
  status: "active" as const,
  escalation_phone: "+15125550100",
  escalation_email: "owner@example.com",
  greeting_override: "",
  hours: {},
  services_offered: [],
  services_not_offered: [],
  coverage_zip_codes: [],
  custom_urgency_rules: [],
  created_at: "2026-05-04T12:00:00.000Z",
  updated_at: "2026-05-04T12:00:00.000Z",
};

describe("TenantConfigCache", () => {
  beforeEach(() => {
    TenantConfigCache._resetForTests();
  });

  it("caches tenant lookups; second hit does not call the loader", async () => {
    const loader: TenantConfigLoader = {
      loadTenantById: vi.fn().mockResolvedValue(sampleTenant),
      loadScaffoldChain: vi.fn(),
      resolveAgent: vi.fn(),
    };
    const cache = new TenantConfigCache(loader, () => 1_000);

    const first = await cache.getTenant(sampleTenant.id);
    const second = await cache.getTenant(sampleTenant.id);

    expect(first).toEqual(sampleTenant);
    expect(second).toEqual(sampleTenant);
    expect(loader.loadTenantById).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after TTL expires", async () => {
    const loader: TenantConfigLoader = {
      loadTenantById: vi.fn().mockResolvedValue(sampleTenant),
      loadScaffoldChain: vi.fn(),
      resolveAgent: vi.fn(),
    };
    let now = 0;
    const cache = new TenantConfigCache(loader, () => now);

    await cache.getTenant(sampleTenant.id);
    now = 60_001; // beyond default 60s TTL
    await cache.getTenant(sampleTenant.id);

    expect(loader.loadTenantById).toHaveBeenCalledTimes(2);
  });

  it("invalidateTenant forces a re-fetch on next access", async () => {
    const loader: TenantConfigLoader = {
      loadTenantById: vi.fn().mockResolvedValue(sampleTenant),
      loadScaffoldChain: vi.fn(),
      resolveAgent: vi.fn(),
    };
    const cache = new TenantConfigCache(loader, () => 1_000);

    await cache.getTenant(sampleTenant.id);
    cache.invalidateTenant(sampleTenant.id);
    await cache.getTenant(sampleTenant.id);

    expect(loader.loadTenantById).toHaveBeenCalledTimes(2);
  });

  it("agent→tenant mapping caches with longer TTL (essentially immutable)", async () => {
    const mapping = { tenant_id: sampleTenant.id, agent_kind: "production" as const };
    const loader: TenantConfigLoader = {
      loadTenantById: vi.fn(),
      loadScaffoldChain: vi.fn(),
      resolveAgent: vi.fn().mockResolvedValue(mapping),
    };
    let now = 0;
    const cache = new TenantConfigCache(loader, () => now);

    await cache.resolveAgent("agent_abc");
    now = 60_001; // tenant cache would expire here, agent cache should not
    await cache.resolveAgent("agent_abc");

    expect(loader.resolveAgent).toHaveBeenCalledTimes(1);
  });

  it("returns null when the agent_id is unknown", async () => {
    const loader: TenantConfigLoader = {
      loadTenantById: vi.fn(),
      loadScaffoldChain: vi.fn(),
      resolveAgent: vi.fn().mockResolvedValue(null),
    };
    const cache = new TenantConfigCache(loader, () => 1_000);

    const result = await cache.resolveAgent("unknown_agent");
    expect(result).toBeNull();
  });
});
