/**
 * In-process tenant config cache for the hot-path service (plan U6 + U9).
 *
 * Why in-process and not Redis: at MVP scale (≤200 logos on a single Render
 * Web Service instance), the cache lives in this process. A typical function
 * call should never round-trip to Postgres. TTL keeps memory bounded and
 * survives a Postgres LISTEN/NOTIFY miss.
 *
 * Invalidation: any UPDATE on tenants/vertical_scaffolds fires a NOTIFY
 * (wired via a Postgres trigger added in a follow-up migration); the cache
 * subscribes via LISTEN. Until that wiring is in place, the TTL is the
 * single guard.
 *
 * Single-instance assumption (round 1 ADV-10): horizontal scale to a second
 * Render instance requires either a shared Redis cache or per-instance LISTEN.
 * Documented in the plan; not a Week 2 concern.
 */
import type { TenantConfig, VerticalScaffold } from "@requesthandoff/schema";

import { logger } from "../observability/logger.js";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000; // 60s — short enough that a missed NOTIFY is bounded.

const tenantCache = new Map<string, CacheEntry<TenantConfig>>();
const scaffoldCache = new Map<string, CacheEntry<VerticalScaffold>>();
const agentToTenantCache = new Map<string, CacheEntry<{ tenant_id: string; agent_kind: "production" | "demo" }>>();

function get<T>(map: Map<string, CacheEntry<T>>, key: string, now: number): T | null {
  const entry = map.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    map.delete(key);
    return null;
  }
  return entry.value;
}

function set<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number, now: number): void {
  map.set(key, { value, expiresAt: now + ttlMs });
}

export interface TenantConfigLoader {
  loadTenantById(tenantId: string): Promise<TenantConfig | null>;
  loadScaffoldChain(vertical: TenantConfig["vertical"]): Promise<VerticalScaffold[]>;
  resolveAgent(retellAgentId: string): Promise<{ tenant_id: string; agent_kind: "production" | "demo" } | null>;
}

/**
 * Public cache API. The four hot-path tool handlers call these to keep p99 < 150ms (R8/R9).
 * `now` is injected for deterministic tests.
 */
export class TenantConfigCache {
  constructor(private readonly loader: TenantConfigLoader, private readonly nowFn: () => number = Date.now) {}

  async getTenant(tenantId: string): Promise<TenantConfig | null> {
    const now = this.nowFn();
    const cached = get(tenantCache, tenantId, now);
    if (cached) {
      return cached;
    }
    const fresh = await this.loader.loadTenantById(tenantId);
    if (fresh) {
      set(tenantCache, tenantId, fresh, DEFAULT_TTL_MS, now);
    }
    return fresh;
  }

  async getScaffoldChain(vertical: TenantConfig["vertical"]): Promise<VerticalScaffold[]> {
    const now = this.nowFn();
    const cached = get(scaffoldCache, vertical, now);
    if (cached) {
      return [cached];
    }
    const chain = await this.loader.loadScaffoldChain(vertical);
    // Cache only the leaf — `loadScaffoldChain` returns the full inheritance chain
    // (HVAC -> General). Re-fetching the chain on a cache miss is cheap (≤2 rows).
    if (chain.length > 0) {
      set(scaffoldCache, vertical, chain[0]!, DEFAULT_TTL_MS, now);
    }
    return chain;
  }

  async resolveAgent(retellAgentId: string): Promise<{ tenant_id: string; agent_kind: "production" | "demo" } | null> {
    const now = this.nowFn();
    const cached = get(agentToTenantCache, retellAgentId, now);
    if (cached) {
      return cached;
    }
    const fresh = await this.loader.resolveAgent(retellAgentId);
    if (fresh) {
      // agent→tenant mapping is essentially immutable post-provisioning; safe to cache longer.
      set(agentToTenantCache, retellAgentId, fresh, DEFAULT_TTL_MS * 5, now);
    }
    return fresh;
  }

  /** Test/ops hook — invalidates a tenant's cache entry. Wire to Postgres NOTIFY in a follow-up. */
  invalidateTenant(tenantId: string): void {
    tenantCache.delete(tenantId);
    logger.info({ tenant_id: tenantId, action: "cache_invalidate" }, "tenant cache invalidated");
  }

  /** Reset for tests. */
  static _resetForTests(): void {
    tenantCache.clear();
    scaffoldCache.clear();
    agentToTenantCache.clear();
  }
}
