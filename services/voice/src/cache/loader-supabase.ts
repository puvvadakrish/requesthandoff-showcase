/**
 * Supabase-backed loader for the TenantConfigCache.
 * Lives outside the cache module so the cache stays storage-agnostic + testable.
 */
import {
  TenantConfigSchema,
  VerticalScaffoldSchema,
  type TenantConfig,
  type VerticalScaffold,
} from "@requesthandoff/schema";
import {
  createServiceSupabase,
  resolveTenantFromAgent,
} from "@requesthandoff/supabase-client-service";

import { logger } from "../observability/logger.js";
import type { TenantConfigLoader } from "./tenant-config.js";

export class SupabaseTenantLoader implements TenantConfigLoader {
  private readonly client = createServiceSupabase();

  async loadTenantById(tenantId: string): Promise<TenantConfig | null> {
    const { data, error } = await this.client
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();

    if (error) {
      logger.error({ tenant_id: tenantId, err: error.message }, "loadTenantById failed");
      throw error;
    }
    if (!data) return null;

    const parsed = TenantConfigSchema.safeParse(stripPostCallOnlyTenantColumns(data));
    if (!parsed.success) {
      logger.error(
        { tenant_id: tenantId, issues: parsed.error.issues },
        "tenant row failed schema validation",
      );
      throw new Error(`Tenant ${tenantId} failed schema validation`);
    }
    return parsed.data;
  }

  /**
   * Walks the parent_id chain so HVAC -> General returns [HVAC, General].
   * The cache layer treats the leaf (index 0) as the canonical entry.
   */
  async loadScaffoldChain(vertical: TenantConfig["vertical"]): Promise<VerticalScaffold[]> {
    const { data, error } = await this.client
      .from("vertical_scaffolds")
      .select("*")
      .eq("vertical", vertical);

    if (error) {
      logger.error({ vertical, err: error.message }, "loadScaffoldChain failed");
      throw error;
    }
    if (!data || data.length === 0) return [];

    // Build a lookup, then walk the parent chain starting from the requested vertical's leaf.
    const byId = new Map<string, VerticalScaffold>();
    for (const row of data) {
      const parsed = VerticalScaffoldSchema.safeParse(row);
      if (!parsed.success) {
        logger.error({ vertical, issues: parsed.error.issues }, "scaffold row failed validation");
        continue;
      }
      byId.set(parsed.data.id, parsed.data);
    }

    // Find the leaf — the one whose `vertical` matches the requested vertical.
    const leaf = [...byId.values()].find((s) => s.vertical === vertical);
    if (!leaf) return [];

    const chain: VerticalScaffold[] = [leaf];
    let current: VerticalScaffold | undefined = leaf;
    while (current?.parent_id) {
      const parent = byId.get(current.parent_id);
      if (!parent) break;
      chain.push(parent);
      current = parent;
    }
    return chain;
  }

  async resolveAgent(retellAgentId: string) {
    return resolveTenantFromAgent(this.client, retellAgentId);
  }
}

function stripPostCallOnlyTenantColumns(row: unknown): unknown {
  if (!row || typeof row !== "object") return row;
  const copy = { ...(row as Record<string, unknown>) };
  delete copy["outbound_webhook_secret_ciphertext"];
  return copy;
}
