/**
 * Per-tenant playbook composition (plan U9 + D14).
 *
 * Merges:
 *   1. Life-Safety Baseline (rules from the General scaffold, marked is_life_safety: true)
 *   2. Vertical-specific scaffold rules (HVAC adds emergency triage rules on top)
 *   3. Secondary-services scaffolds (e.g., HVAC tenant who also does plumbing — when
 *      a plumbing scaffold ships in v1.1, its rules merge in here for that tenant)
 *   4. Per-tenant custom_urgency_rules (cannot weaken life-safety rules per R10)
 *
 * Output: a single composed playbook ready to send to the runtime layer
 * (Retell, currently — see services/voice/src/runtime/retell.ts) at startCall.
 *
 * This is pure data transformation — no I/O, no side effects, no LLM. Trivially
 * testable; every edge case the plan calls out is in the test file.
 */
import type {
  TenantConfig,
  TwoPartyConsentState,
  UrgencyRule,
  VerticalScaffold,
} from "@requesthandoff/schema";
import {
  TWO_PARTY_CONSENT_STATES,
} from "@requesthandoff/schema";

const TWO_PARTY_SET = new Set<TwoPartyConsentState>(TWO_PARTY_CONSENT_STATES);

export interface ComposedPlaybook {
  /** Final greeting string sent to Retell (D11 + scaffold prefix + business name). */
  greeting: string;
  /** Final urgency rule list (life-safety + vertical + secondary + custom, deduped). */
  urgency_rules: UrgencyRule[];
  /** Field list the agent should collect during intake. */
  qualification_fields: VerticalScaffold["qualification_fields"];
  /** Recommended-action heuristics for post-call lead recommendation. */
  recommended_actions: VerticalScaffold["recommended_actions"];
  /** Whether the warm-transfer flow should inject a recording-disclosure prompt (D11). */
  multi_state_warning_required: boolean;
  /** Languages the agent supports in-call. Anything else routes to the non-English fallback. */
  supported_languages: string[];
}

const DEFAULT_GREETING_TEMPLATE = "Hi, this is {{business_name}} — for quality, this call may be recorded. How can I help you today?";

interface ComposeArgs {
  tenant: TenantConfig;
  /** Scaffold chain leaf-first: e.g. [hvac, general] for an HVAC tenant. */
  scaffoldChain: VerticalScaffold[];
  /** Optional secondary-vertical scaffold chains (D14). */
  secondaryScaffoldChains?: VerticalScaffold[][];
}

export function composePlaybook({
  tenant,
  scaffoldChain,
  secondaryScaffoldChains = [],
}: ComposeArgs): ComposedPlaybook {
  const greeting = buildGreeting(tenant, scaffoldChain);
  const urgency_rules = mergeUrgencyRules(tenant, scaffoldChain, secondaryScaffoldChains);
  const qualification_fields = mergeQualificationFields(scaffoldChain);
  const recommended_actions = mergeRecommendedActions(scaffoldChain);
  const multi_state_warning_required = isTwoPartyConsentState(tenant.primary_state);

  return {
    greeting,
    urgency_rules,
    qualification_fields,
    recommended_actions,
    multi_state_warning_required,
    // English baseline at MVP; non-English callers route to a fallback path
    // before any agent improvisation. Spanish + English hand-off phrasing is
    // handled in the runtime layer, not in the prompt.
    supported_languages: ["en"],
  };
}

function buildGreeting(tenant: TenantConfig, scaffoldChain: VerticalScaffold[]): string {
  if (tenant.greeting_override.trim() !== "") {
    return tenant.greeting_override.replace(/\{\{business_name\}\}/g, tenant.business_name);
  }
  // Use the leaf scaffold's greeting prefix if set; otherwise fall back to the default.
  const leafPrefix = scaffoldChain[0]?.greeting_prefix?.trim();
  const template = leafPrefix && leafPrefix.length > 0
    ? `${leafPrefix} ${DEFAULT_GREETING_TEMPLATE.replace(/^Hi, this is \{\{business_name\}\} — /, "")}`
    : DEFAULT_GREETING_TEMPLATE;
  return template.replace(/\{\{business_name\}\}/g, tenant.business_name);
}

function mergeUrgencyRules(
  tenant: TenantConfig,
  scaffoldChain: VerticalScaffold[],
  secondaryScaffoldChains: VerticalScaffold[][],
): UrgencyRule[] {
  // Walk root → leaf so child scaffolds can layer rules on top of parents.
  // Life-safety rules (parent / General) come first.
  const ordered = [...scaffoldChain].reverse();
  const merged: UrgencyRule[] = [];

  for (const scaffold of ordered) {
    for (const rule of scaffold.urgency_rules) {
      merged.push(rule);
    }
  }

  // Secondary-services scaffolds (e.g., HVAC tenant who also does plumbing).
  // Skip the General-scaffold rules in secondary chains since they're already merged
  // from the primary chain.
  for (const chain of secondaryScaffoldChains) {
    for (let i = chain.length - 1; i >= 0; i--) {
      const scaffold = chain[i]!;
      if (scaffold.parent_id === null) continue; // skip duplicate General rules
      for (const rule of scaffold.urgency_rules) {
        merged.push(rule);
      }
    }
  }

  // Tenant custom rules layer on top, but they cannot weaken life-safety rules (R10).
  // Custom rules with the same phrase as a life-safety rule are dropped.
  const lifeSafetyPhrases = new Set(
    merged.filter((r) => r.is_life_safety).map((r) => r.phrase.toLowerCase()),
  );
  for (const customRule of tenant.custom_urgency_rules) {
    if (lifeSafetyPhrases.has(customRule.phrase.toLowerCase())) continue;
    merged.push({
      phrase: customRule.phrase,
      severity: customRule.severity,
      ...(customRule.description !== undefined && { description: customRule.description }),
      is_life_safety: false,
    });
  }

  return dedupeByPhrase(merged);
}

function dedupeByPhrase(rules: UrgencyRule[]): UrgencyRule[] {
  const seen = new Map<string, UrgencyRule>();
  for (const rule of rules) {
    const key = rule.phrase.toLowerCase();
    const existing = seen.get(key);
    // Preserve life-safety priority: a life-safety rule cannot be overwritten by a non-LS one
    // and a more-severe rule wins over a less-severe one.
    if (!existing) {
      seen.set(key, rule);
      continue;
    }
    if (existing.is_life_safety && !rule.is_life_safety) continue;
    if (existing.severity === "urgent" && rule.severity !== "urgent") continue;
    seen.set(key, rule);
  }
  return [...seen.values()];
}

function mergeQualificationFields(scaffoldChain: VerticalScaffold[]): VerticalScaffold["qualification_fields"] {
  const ordered = [...scaffoldChain].reverse();
  const seen = new Map<string, VerticalScaffold["qualification_fields"][number]>();
  for (const scaffold of ordered) {
    for (const field of scaffold.qualification_fields) {
      seen.set(field.key, field);
    }
  }
  return [...seen.values()];
}

function mergeRecommendedActions(scaffoldChain: VerticalScaffold[]): VerticalScaffold["recommended_actions"] {
  const ordered = [...scaffoldChain].reverse();
  const seen = new Map<string, VerticalScaffold["recommended_actions"][number]>();
  for (const scaffold of ordered) {
    for (const action of scaffold.recommended_actions) {
      seen.set(action.id, action);
    }
  }
  return [...seen.values()];
}

function isTwoPartyConsentState(state: string): boolean {
  return TWO_PARTY_SET.has(state as TwoPartyConsentState);
}
