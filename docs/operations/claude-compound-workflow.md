---
title: Claude + Compound Engineering v3.20 Workflow
date: 2026-07-24
status: active
parent: AGENTS.md / CLAUDE.md
compound_engineering_version: 3.20.0
---

# Claude + Compound Engineering v3.20 Workflow

This is RequestHandoff's smallest effective operating system for Compound Engineering v3.20.0. `AGENTS.md` defines repository rules; this document routes work from evidence or a decision into one approved unified plan, proportionate implementation, verification, and handoff.

Human-gated decisions and shipping are the default. Autonomous mutating workflows are opt-in for one run and require explicit authorization.

## 1. Authority and session startup

Every session begins by establishing repository and product truth.

1. Confirm you are in the repository root.
2. Read `AGENTS.md` completely, then inspect the current branch, HEAD, worktree, staged changes, and untracked files before editing.
3. Preserve tracked and untracked work. Never open or print untracked runtime environment files or secret values.
4. For product, copy, architecture, or scope decisions, read in authority order:
   - `STRATEGY.md`
   - `GTM-PLAYBOOK.md`
   - `docs/PRD.md`
5. For design or frontend work, also read the canonical design documents and `apps/dashboard/app/design-tokens.css`.
6. Read the active plan named by the user or by the routing section below. Do not infer that the newest file is executable.

If the product documents conflict, `STRATEGY.md` wins unless the founder explicitly overrides it. Surface an override so the canonical source can be updated through `ce-strategy` when appropriate.

## 2. Current artifact routing

- `docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md` is a historical record. It is not an executable plan and must not be resumed with `ce-work`.
- `docs/plans/2026-07-23-001-first-design-partner-evidence-sprint.md` is the approved current product-validation artifact. Its immediate gate is five owner conversations and at least one qualified owner who approves a concrete missed-call workflow and is conditionally willing to pilot after named safety gates close.
- Sensitive prospect details, raw interview notes, recordings, and identifiable quotes belong only in the founder's private evidence system. Git may contain non-sensitive status and aggregate findings only.
- Any new engineering slice needs one explicitly approved, implementation-ready unified plan under `docs/plans/`. Product-validation work and engineering work must not be mixed into the same slice.

Legacy brainstorms under `docs/brainstorms/` remain historical inputs. In v3.20, a new brainstorm creates a requirements-stage unified plan under `docs/plans/`; `ce-plan` enriches that same artifact rather than creating a second plan.

## 3. Product guardrails

Every artifact and implementation decision must preserve these RequestHandoff truths:

- Lead with call coverage, captured leads, and handoff outcomes—not AI.
- Cover every moment the business cannot answer, not only after-hours.
- Keep onboarding done-for-you; do not require owners to build scripts or workflows.
- Treat vertical playbooks as table stakes. Flat-rate trust and integration-neutral handoff are the differentiation.
- Do not introduce escalation fees, per-minute traps, or hidden billing surprises.
- Deliver into the customer's existing CRM, dispatch, email, webhook, or related system; do not replace it.
- Let each business approve urgency and escalation rules, and log every escalation attempt.
- Deliver structured leads; transcripts are optional and secondary.

Pause for founder direction if a request conflicts with these rules or expands the MVP without customer evidence.

## 4. Smallest effective v3.20 lifecycle

Use only the stages that materially reduce risk for the current work.

| Situation | Stage | Durable output | Human gate or skip condition |
| --- | --- | --- | --- |
| Read-only question, audit, or diagnosis | Inspect directly; use `ce-debug` for a difficult defect | Evidence-backed answer or diagnosis | Stop before mutation unless a fix is authorized |
| WHAT is materially unresolved | `ce-brainstorm` | Requirements-stage unified plan in `docs/plans/` | Skip when outcome, scope, and non-goals are already settled |
| WHAT is settled | `ce-plan` | New or enriched implementation-ready unified plan | Founder confirms scope before planning; enrich the same artifact |
| Requirements or operational risk is meaningful | `ce-doc-review` | Findings resolved in the source plan | Humans approve any meaning-changing resolution; skip for trivial mechanical work |
| Implementation is explicitly authorized | `ce-work` | Surgical repository changes plus verification evidence | Separate implementation approval is mandatory |
| The change adds meaningful code complexity | `ce-simplify-code` | Simpler verified implementation | Normally use at about 30 or more substantive code lines; skip docs/config-only work |
| Non-mechanical code, agent instructions, workflow policy, or effective configuration changed | `ce-code-review` | Prioritized behavioral findings and validated fixes | Treat agent-facing Markdown, YAML, and configuration as behavior-bearing and explicitly select an agent-native reviewer; skip only when the change is purely mechanical and cannot alter agent or runtime behavior; do not fix unrelated issues |
| User-facing browser behavior changed | `ce-test-browser` | Browser verification evidence | Skip for non-UI changes or when hosted/local access is not authorized |
| User-facing quality needs a bounded pass | `ce-polish` | Focused quality fixes | Avoid broad polishing before customer evidence |
| Shipping is explicitly authorized | `ce-commit-push-pr` | Commit, push, and pull request | Never infer shipping authority from implementation approval; pass `babysit:off` unless monitoring is separately authorized for this run |
| A pull request needs monitoring | `ce-babysit-pr` | Reported checks and review state | Opt-in only; require explicit current-run authorization and never rely on an ignored local config to propagate this policy |
| A verified solution will recur | `ce-compound` | Reusable solution knowledge | Skip ordinary or speculative work; use `ce-compound-refresh` only when that knowledge becomes stale |
| Work pauses or changes sessions | `ce-handoff` | Concise continuation state | Use when context would otherwise be lost |

`ce-ideate` is optional for broad option generation before scope exists. `ce-pov` is for a deliberate independent perspective. `ce-worktree` is conditional on an approved isolation need. `ce-strategy` is reserved for intentional strategy changes. None is a mandatory ceremony.

`lfg` and other autonomous mutating workflows are avoided by default. They may run only when the founder authorizes that autonomous scope, its external/tool boundaries, and its shipping behavior for the specific run.

## 5. Unified plan and progress rules

A unified plan starts at requirements-stage when brainstorming is necessary and becomes implementation-ready through `ce-plan`. Do not fork a separate brainstorm artifact and implementation plan for the same slice.

An implementation-ready plan should name:

- product and pilot outcome;
- scope and non-goals;
- likely files and sequence;
- tests and local or hosted verification;
- provider, tenant, privacy, and compliance boundaries;
- rollback, monitoring, and evidence collection where runtime behavior is affected;
- settled decisions, open decisions, and explicit authorization gates.

Plan artifacts describe intended work; they are not live task trackers. Do not check off plan sections during execution. Derive progress from the current task state, git diff, verification output, and a session handoff. Update a plan only when its scope or durable decision changes.

## 6. Human authority and safety gates

These are independent gates; passing one does not pass another:

1. **Scope gate:** the founder confirms the outcome, scope, and non-goals.
2. **Implementation gate:** `ce-work` or any other mutation requires explicit authorization.
3. **External-action gate:** outreach, calls, email, provider access, hosted changes, migrations, and external accounts require explicit authorization.
4. **Product gate:** pricing, positioning, ICP, compliance posture, recording disclosure, escalation behavior, failure promises, integrations, and MVP expansion require founder decisions.
5. **Shipping gate:** staging, committing, pushing, opening a pull request, merging, deploying, and PR babysitting require explicit authorization.
6. **Autonomy gate:** `lfg`, dogfood mutation, external implementation engines, and autonomous PR workflows require a one-run approval.

Never weaken tenant isolation, service-role boundaries, webhook protections, escalation controls, provider safety, or secret handling to move faster.

## 7. Local configuration and model routing

`.compound-engineering/config.local.example.yaml` is the stock installed-v3.20 reference. Each checkout may use an ignored `.compound-engineering/config.local.yaml` for private defaults.

The desired conservative defaults for each configured checkout are:

- Markdown outputs;
- pre-plan scope confirmation enabled;
- native `work_engine_mode` off unless a user authorizes a one-run override;
- `auto_babysit: false`;
- no standing model elevation;
- no standing cross-model peer.

The ignored local file is optional and per-checkout. Its absence, including in a fresh clone or worktree, must not be interpreted as repository-level enforcement: installed CE defaults may still enable automatic PR babysitting. Pass the explicit `babysit:off` token on every `ce-commit-push-pr` invocation unless the user separately authorizes PR monitoring for the current run. Do not start `ce-babysit-pr` on the basis of a local default alone.

Model elevation should be proportional to ambiguity and risk, not routine. Invoking `ce-code-review`, selecting an adversarial pass, or receiving an egress disclosure does not grant external-model authority; an absent `cross_model_peer` setting is not an egress control. Every `ce-code-review` invocation must state `external review: prohibited` and use only in-process reviewers under the current installed behavior. An external peer may be considered only when the same current-run request separately authorizes the named recipient/model and material scope **and** the review runs from a verified tracked-only, sanitized review package limited to the approved diff and named context. Its preflight must prove ignored and untracked paths, the five protected runtime artifacts, private evidence, and secret-bearing files are absent and unreadable from every authorized peer route. Until that isolation is available and verified, external-peer review remains prohibited even with user interest. Never send secrets, runtime environment files, private prospect data, raw interview notes, recordings, identifiable quotes, provider payloads, or customer call data to an external model.

## 8. Verification and review

Before and after a mutation:

- inspect branch, HEAD, staged state, tracked diff, and untracked files;
- verify only the intended paths changed and unrelated/user-owned work is preserved;
- run the narrowest relevant check first, followed by broader repository checks only when the change justifies them;
- record skipped checks and why;
- do not access hosted systems, providers, or live data without a separate authorization.

For dashboard code, the normal local checks are:

```bash
pnpm --filter @requesthandoff/dashboard typecheck
pnpm --filter @requesthandoff/dashboard build
```

Run broader workspace checks only when the affected surface warrants them. Documentation and configuration-only changes normally need syntax, routing, ignore, permission, diff, and preservation checks—not application builds.

## 9. Product Pulse timing

Use `ce-product-pulse` only when RequestHandoff has a trustworthy evidence source: customer-observed interviews, an instrumented pilot, or production behavior with clear provenance. Synthetic demos and desk research may provide context but must not be reported as customer evidence.

Before the first live pilot, use the approved evidence sprint and its existing scorecards and gates. After observed pilot data exists, a read-only Product Pulse can synthesize explicitly named sources and recommend priorities. Any mutation or new measurement integration remains separately gated.

## 10. Session handoff

Use `ce-handoff` when work pauses, crosses sessions, or leaves unresolved risk. Keep it concise:

```markdown
## Done

- Durable decisions or completed changes.

## Files

- Paths changed and why.

## Verification

- Checks run and material results.

## Blocked / Decisions

- Remaining owner decisions, risks, or authority boundaries.

## Next

- Smallest next action and the Compound Engineering stage, if any.
```

This keeps RequestHandoff legible across Claude, Codex, and future Compound Engineering sessions without adding process ahead of customer evidence.
