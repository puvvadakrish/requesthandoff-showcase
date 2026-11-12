---
title: Compound Engineering v3.20 Bootstrap and Repository Hygiene - Plan
type: chore
date: 2026-07-24
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# Compound Engineering v3.20 Bootstrap and Repository Hygiene - Plan

## Goal Capsule

- **Objective:** Make RequestHandoff's local Compound Engineering v3.20 operating boundary explicit and safe without touching product behavior or unowned files.
- **Authority:** The user's confirmed scope and non-goals govern this plan; AGENTS.md governs repository location and product boundaries; the installed Compound Engineering v3.20.0 files govern skill behavior.
- **Execution profile:** Native, local, and human-gated. No standing model elevation, cross-model peer, external execution route, or autonomous shipping tail is enabled.
- **Stop conditions:** Stop before modifying any apparent Outpost path, reading secret values, widening an ignore rule, contacting an external system, changing product code, or staging repository changes.
- **Tail ownership:** Leave all authorized changes uncommitted and unstaged for the user to inspect.

---

## Product Contract

### Summary

This plan adds the minimum repository protections and operating guidance needed to use Compound Engineering v3.20 safely in RequestHandoff while preserving the separate first-design-partner validation lane.

### Problem Frame

The repository has useful product, pilot, and evidence artifacts, but its Compound Engineering workflow document describes an older multi-artifact lifecycle and obsolete skill names. Five local runtime artifacts are unignored and group/world-readable. The checkout also contains 56 apparent Outpost paths whose ownership is not fully reconciled. An effective closeout must fix the known RequestHandoff-owned safety gaps without turning ambiguity into destructive cleanup.

### Requirements

#### Runtime and local configuration safety

- R1. Add root-anchored ignore entries for .render-voice-image-tag, .supabase-hosted-runtime.env, .supabase-hosted.env, .vercel-production-runtime.env, .vercel-render-check.env, and .compound-engineering/*.local.yaml without adding broad patterns that could conceal source or evidence.
- R2. Confirm each named runtime artifact is a regular non-symlink file, then restrict it to owner read/write access without opening, printing, copying, or otherwise exposing its contents; stop on any unexpected file type.
- R3. Add the installed v3.20.0 stock configuration template at .compound-engineering/config.local.example.yaml.
- R4. Add an owner-only, ignored .compound-engineering/config.local.yaml that selects Markdown plan, brainstorm, and ideation outputs; keeps scoping confirmation enabled; disables the standing work-engine preference and automatic PR babysitting; and defines no standing model elevation or cross-model peer. Treat these as per-checkout defaults, not repository-enforced policy: every shipping invocation must pass `babysit:off` unless monitoring is separately authorized for that run, and every `ce-code-review` invocation must state `external review: prohibited` under the current installed behavior.

#### Workflow and artifact routing

- R5. Update docs/operations/claude-compound-workflow.md to describe the v3.20 unified Product Contract-to-implementation-ready plan lifecycle, current skill names, git/task-derived progress, proportional simplify/review stages that explicitly select agent-native review for behavior-bearing instructions and configuration, explicit autonomy and shipping gates, safe fresh-checkout PR handoff, session handoff, and an external-peer prohibition unless both separate current-run authorization and verified tracked-only isolation exist, plus evidence-based Product Pulse timing.
- R6. State that docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md is historical and non-executable, while docs/plans/2026-07-23-001-first-design-partner-evidence-sprint.md is the current product-validation artifact and does not authorize product implementation or outreach.

#### Ambiguous cross-project material

- R7. Classify the 56 apparent Outpost paths using only explicitly enumerated regular-file paths, tracked-index state, ephemeral sizes, and ephemeral non-reversible hashes against the canonical Outpost checkout; report only category counts, already-visible candidate identifiers, confidence, and reconciliation guidance without persisting raw fingerprints or modifying either copy.
- R8. Do not delete, move, copy, edit, stage, commit, or ignore any apparent Outpost path or other unrelated user-owned change.

#### Verification and handoff

- R9. Verify ignore behavior, local configuration values, example-template fidelity, filesystem modes, documentation routing, diff hygiene, and the final unstaged/uncommitted state without calling providers or hosted systems.

### Acceptance Examples

- AE1. Given the five known runtime filenames, when Git ignore resolution is checked, each resolves to its own exact root rule and no general environment-file rule was added. Covers R1.
- AE2. Given the installed v3.20.0 stock template, when it is compared with the repository example, they are byte-identical; the ignored local file activates only the approved conservative defaults in its checkout, while every shipping invocation still requires explicit `babysit:off` unless monitoring is separately authorized for that run. Covers R3, R4.
- AE3. Given the 56 Outpost candidates, when classification finishes, the report distinguishes exact identical paths, exact divergent paths, and candidates with no exact current path while every candidate remains untouched. Covers R7, R8.

### Scope Boundaries

#### In scope

- Exact ignore protection and local file modes for the named runtime artifacts.
- Compound Engineering example/private configuration.
- One operating-workflow document update.
- Artifact-routing clarification.
- Read-only Outpost ownership evidence and a proposed reconciliation.
- Local diagnostic verification.

#### Outside this plan

- Product code, tests, features, discovery execution, outreach, prospect contact, private Sheet work, provider access, hosted/database work, CI expansion, dependencies, migrations, external-model egress, lfg, dogfood mutation, autonomous PR work, and GitHub changes.
- Staging, committing, pushing, opening a PR, or changing branches/worktrees.
- Editing historical plans broadly or recording execution progress inside a plan.
- Any mutation of the 56 apparent Outpost paths until ownership is separately verified and approved.

---

## Planning Contract

### Key Technical Decisions

- KTD1. **Exact-path safety rules.** Use one root-anchored ignore entry per known runtime artifact plus the narrow .compound-engineering/*.local.yaml rule. (session-settled: user-directed — chosen over broad runtime or environment globs: broad rules could hide source or evidence.)
- KTD2. **Conservative local CE defaults with fresh-checkout fail-safe.** Keep Markdown outputs, confirmation-on planning, native execution, manual PR monitoring, and no persistent alternate-model routing. Because ignored local configuration does not propagate, pass `babysit:off` on every shipping invocation unless monitoring is separately authorized for that run. Because the installed review skill may cross an egress boundary after disclosure and can read checkout files, every invocation must prohibit external review; permit a peer only after separate current-run authorization and a verified tracked-only sanitized package makes protected paths unreadable. (session-settled: user-directed — chosen over standing autonomy or model routing: every egress and mutation boundary should remain per-run and human-gated.)
- KTD3. **Routing guidance instead of historical rewrites.** Clarify which plan is historical and which validation artifact is current in the operating workflow; do not retrofit or mark up legacy plan bodies. (session-settled: user-directed — chosen over broad historical-artifact edits: repository history should remain intact.)
- KTD4. **Metadata-only Outpost provenance comparison.** Use filenames, Git index state, sizes, and non-reversible hashes to classify duplication or provenance signals; never treat metadata as ownership intent, and do not open or quote candidate content. (session-settled: user-directed — chosen over content inspection or automatic reconciliation: ownership is not yet authorized.)
- KTD5. **Local-only implementation tail.** Execute inline, verify locally, and stop with changes unstaged and uncommitted. (session-settled: user-directed — chosen over Compound Engineering's normal commit/PR tail: shipping authority was explicitly withheld.)

### Sequencing

1. Capture an ephemeral read-only baseline of branch, HEAD, index state, untracked paths, authorized tracked diffs, and path/size/mode/hash tuples for the 56 Outpost candidates.
2. Establish the plan and review its safety, scope, and feasibility.
3. Land ignore protection before adding the private local configuration.
4. Restrict runtime file modes without reading their contents.
5. Update the workflow and routing guidance.
6. Finish the read-only Outpost classification and verify all boundaries against the baseline.

### Risks and Mitigations

- **An ignore rule hides legitimate work:** use exact root filenames and verify each rule with Git's ignore resolver.
- **The example drifts from installed v3.20.0:** copy the installed template verbatim and compare it byte-for-byte.
- **A private setting accidentally enables egress or autonomy:** activate only the approved keys and verify that model/peer preference lines remain absent or commented.
- **Outpost metadata is mistaken for ownership:** describe exact identity as a duplication/provenance signal only, treat every category as ownership-unverified, and require separate approval for every later mutation.
- **The dirty worktree obscures scope:** inspect path-limited diffs and final status; never stage or normalize unrelated files.

---

## Implementation Units

### U1. Protect local runtime and CE configuration

- **Goal:** Prevent accidental Git exposure and tighten local access while installing the conservative v3.20 configuration.
- **Requirements:** R1-R4, AE1, AE2; KTD1, KTD2.
- **Dependencies:** None.
- **Files:** .gitignore, .compound-engineering/config.local.example.yaml, .compound-engineering/config.local.yaml, .render-voice-image-tag, .supabase-hosted-runtime.env, .supabase-hosted.env, .vercel-production-runtime.env, and .vercel-render-check.env.
- **Approach:** Add only the approved ignore entries, reproduce the installed stock example exactly, and create the private local settings file. Confirm each permission target is a regular non-symlink file, then set the private config and runtime files to owner-only access without reading their contents.
- **Execution note:** This is configuration and filesystem hardening; use path/mode and byte-comparison checks instead of unit tests.
- **Patterns to follow:** Existing root .gitignore; installed v3.20.0 skills/ce-setup/references/config-template.yaml.
- **Test scenarios:** Test expectation: none -- no application behavior changes; AE1 and AE2 are verified through repository diagnostics.
- **Verification:** Every named path resolves to the intended ignore rule, the example matches the installed template, the private file contains only approved active settings, every permission target is a regular non-symlink file, and each reports mode 600 without broader ACL access.

### U2. Align the repository operating workflow

- **Goal:** Replace obsolete Compound Engineering routing with the smallest current v3.20 lifecycle and make plan ownership unambiguous.
- **Requirements:** R5, R6; KTD3, KTD5.
- **Dependencies:** None.
- **Files:** docs/operations/claude-compound-workflow.md.
- **Approach:** Preserve RequestHandoff product guardrails while replacing obsolete skill names and artifact flow with one requirements-only-to-implementation-ready plan, proportional work/review gates, explicit human authorization, and a separate current product-validation route.
- **Execution note:** Keep this an operating guide, not a product roadmap or exhaustive skill catalog.
- **Patterns to follow:** AGENTS.md; installed v3.20.0 skill contracts for ce-plan, ce-doc-review, and ce-work.
- **Test scenarios:** Test expectation: none -- documentation changes only; verification checks required concepts and rejects obsolete command names.
- **Verification:** The document names the current lifecycle, authority gates, routing, progress model, privacy boundary, Product Pulse trigger, and session handoff without authorizing implementation or outreach.

### U3. Classify Outpost provenance without mutation

- **Goal:** Produce bounded duplication and provenance evidence for a later human ownership decision while preserving every candidate path.
- **Requirements:** R7, R8, AE3; KTD4.
- **Dependencies:** None.
- **Files:** No repository files.
- **Approach:** Enumerate the 56 candidate paths from Git status, stop on any non-regular candidate, and compare only regular files against canonical Outpost's current tracked index and object identities. Keep raw sizes and hashes ephemeral; report categories and a proposed sequence that requires separate owner confirmation for every later move, deletion, copy, edit, stage, or ignore action, including byte-identical matches.
- **Execution note:** Read-only evidence collection only; no candidate content is rendered and no reconciliation action is taken.
- **Patterns to follow:** Repository-hygiene boundary in AGENTS.md.
- **Test scenarios:** Test expectation: none -- classification is diagnostic and has no repository mutation.
- **Verification:** Candidate count remains 56, all candidate paths remain unmodified and unignored, and the report accounts for every path.

### U4. Verify boundaries and hand off

- **Goal:** Prove that the authorized slice is complete and that unrelated state, secrets, and shipping surfaces remain untouched.
- **Requirements:** R9; KTD5.
- **Dependencies:** U1, U2, U3.
- **Files:** No additional repository files.
- **Approach:** Run the Verification Contract against path-limited diffs, ignore resolution, file metadata, configuration keys, workflow vocabulary, Git index state, and the ephemeral pre-execution baseline; report any unexplained delta instead of expanding scope.
- **Execution note:** Verification is read-only and local; do not invoke providers, hosted systems, external models, or the shipping tail.
- **Patterns to follow:** Repository verification commands documented in AGENTS.md and the installed v3.20 skill contracts.
- **Test scenarios:** Test expectation: none -- this unit observes the completed configuration and documentation slice.
- **Verification:** Every gate has an observed result, no staged paths exist, and all unrelated untracked paths retain their pre-execution classification.

---

## Verification Contract

| Gate | Applicability | Done signal |
|---|---|---|
| Git ignore resolution | U1 | Each named runtime path and the private CE config is ignored by its narrow intended rule; Outpost candidates are not ignored by new rules. |
| Template fidelity | U1 | Repository example and installed v3.20.0 template compare byte-identically. |
| Local configuration audit | U1 | Approved keys are active with approved values in this checkout; model elevation, cross-model peer, and standing work preferences are not enabled. Shipping instructions require `babysit:off` on every invocation unless monitoring is separately authorized for that run. Review instructions require `external review: prohibited`; an external peer remains unavailable unless both separate current-run authorization and verified tracked-only isolation make protected paths unreadable. |
| Filesystem mode audit | U1 | The private CE config and all five runtime artifacts are regular non-symlink files, report owner-only 600 permissions, and have no broader ACL entry. |
| Workflow vocabulary and routing scan | U2 | Current skill names and same-plan lifecycle are present; obsolete skill names and checkbox-progress guidance are absent. |
| Outpost provenance accounting | U3 | Exactly 56 candidates are partitioned into duplication/provenance categories; ownership remains unverified; none was changed or newly ignored. |
| Preservation baseline | U4 | Branch, HEAD, staged paths, unrelated tracked diffs, untracked inventory, and all 56 candidate path/size/mode/hash tuples have no unexplained delta from the pre-execution baseline. |
| Diff hygiene | All | git diff --check passes; path-limited diffs contain only authorized files; final status shows no staged changes or commits created by this work. |

---

## Definition of Done

- R1-R9 and AE1-AE3 are satisfied with observed local evidence.
- The non-ignored repository example intended for version control and the operating workflow are ready for review; the ignored local config exists only in this checkout.
- The five runtime artifacts are ignored and mode 600, with no secret value read or printed.
- The 56 Outpost candidates are fully accounted for and untouched.
- No product code, external system, dependency, CI workflow, provider, database, branch, index, commit, PR, or GitHub state changed.
- No dead-end or experimental artifacts were added.
- All authorized changes remain unstaged and uncommitted.
