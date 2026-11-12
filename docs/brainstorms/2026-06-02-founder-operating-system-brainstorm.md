---
date: 2026-06-02
topic: founder-operating-system
---

# Founder Operating System Brainstorm

## What We're Building

RequestHandoff already has a strong strategy spine: `STRATEGY.md` owns positioning, `GTM-PLAYBOOK.md` owns the tactical market motion, `docs/PRD.md` preserves long-form requirements, `docs/brainstorms/requesthandoff-design-requirements.md` captures the MVP technical requirements, and `docs/plans/2026-05-04-001-feat-requesthandoff-mvp.md` sequences the first MVP build.

The missing layer is an operating system for how Claude/Codex and Compound Engineering should move work through the repo without drifting from the strategy. This should be a lightweight workflow document that tells future sessions exactly how to start, which docs to read, which skill to invoke, what artifact to produce, when to ask the founder, and when a task is ready to become a plan or implementation branch.

## Why This Approach

We considered three directions: a product gap audit, an execution readiness pack, and a founder operating system. The founder operating system is the best first document because it makes every later artifact more reliable. It does not replace strategy, GTM, PRD, or plans; it routes work through them in the correct order.

This also fits RequestHandoff's current stage. The product is no longer a blank slate, but it is early enough that workflow drift is dangerous: an agent could overbuild, lead with AI, add non-MVP integrations, or treat the dashboard as the system of record. A Claude/Compound workflow guardrail prevents those mistakes before implementation planning begins.

## Key Decisions

- **Create a workflow doc, not another product strategy doc:** Strategy already lives in `STRATEGY.md`; the new document should define process and artifact handoff.
- **Keep `AGENTS.md` and `CLAUDE.md` as entrypoint rules:** They should remain concise and point to deeper workflow docs instead of absorbing every operating detail.
- **Use Compound skills by phase:** `ce-brainstorm` for WHAT, `ce-plan` for HOW, implementation/review skills only after a plan exists, and solved-problem documentation only after a verified fix.
- **Make strategy precedence explicit:** New work starts from `STRATEGY.md`, checks `GTM-PLAYBOOK.md`, then uses `docs/PRD.md` only for deeper detail.
- **Protect MVP scope:** Any proposal outside the locked MVP must either be rejected, marked v1.1, or explicitly approved by the founder.
- **Prefer evidence artifacts before implementation:** Owner interviews, audit/demo readiness, compliance stance, and failure-mode contract should be documented before they become code.

## Documentation To Create

- `docs/operations/claude-compound-workflow.md`: canonical agent workflow for starting sessions, choosing skills, generating artifacts, planning, implementation, review, and handoff.
- `AGENTS.md` and `CLAUDE.md`: add a short pointer to the workflow doc so future sessions find it immediately.
- Optional future gap docs: compliance stance, failure-mode contract, owner-interview script, first-logo readiness checklist, and v1.1 backlog policy.

## Resolved Questions

- **Which direction comes first?** Founder selected Approach 1: Founder Operating System.
- **Should we use Compound skills?** Yes. Use them phase-by-phase where appropriate rather than invoking all skills for every task.

## Open Questions

(None for this brainstorm. The workflow doc can proceed as a draft operating artifact.)

## Next Steps

→ Review `docs/operations/claude-compound-workflow.md`.
→ If approved, add a concise pointer from `AGENTS.md` and `CLAUDE.md`.
→ Then run `/prompts:ce-plan` or the matching Compound planning workflow for the next implementation slice.
