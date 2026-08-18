# frontier-smol-handoff

Date: 2026-08-18
Status: draft
Type: project skill (`.claude/skills/frontier-smol-handoff/SKILL.md`)

## Problem

Agents one-shot implementation, or they write a plan in plan mode and hand that sterile plan to a cheap model. Both waste frontier tokens or starve the cheap model of live exploration context.

The intended workflow: frontier explores, writes a todo list, starts only when confident, is stopped after the first code edit, then a cheap executor continues from the **same session transcript**.

## Decision

Do not invent a custom two-phase protocol. Encode the workflow as a hard-gate skill that uses OMP built-in prewalk and model roles.

| Role | OMP alias | Job |
|---|---|---|
| Frontier | the session's active model at invoke (`@default` or `@slow`) | Explore, todo, first directional edit |
| Cheap executor | `@smol` (`--prewalk-into`, default) | Continue from the live transcript |

Arming (any one is enough):

- `omp --prewalk` (optional `--prewalk-into=@smol`)
- `prewalk.enabled` in settings
- agent frontmatter `prewalk: true` or `prewalk: "@smol"`
- `task.prewalk` / `task.agentPrewalk` for spawned `task` agents

Handoff mechanics are harness-owned: the first workspace-mutating `edit`/`write` (source, not `todo` / notes / `local://`) after a committed todo list switches the session model to the prewalk target. The cheap model inherits the transcript. No plan file.

## Anti-patterns (hard forbid)

- One-shot the whole task on frontier
- Plan mode or `--plan-yolo` then hand a written plan to `@smol`
- Spawn cheap `task` agents with a plan and no exploration context
- Frontier keeps editing after the first mutating write
- `@smol` starts a new architecture after the switch

Plan mode clears prewalk. If plan mode is on, this skill does not apply.

## Hard gates

1. No workspace-mutating `edit`/`write` until a phased todo list exists (named phases, concrete tasks, not "implement the feature") and exploration is declared complete.
2. First workspace-mutating tool call is the last frontier action. Keep it small and directional.
3. After the switch, `@smol` executes the existing todo. No new research, no new design.
4. If prewalk is not armed when the skill is invoked: tell the user to enable it, or stop after the first edit and ask them to switch to `@smol`. Do not keep going on frontier.

## Trigger

Explicit only. User invokes `/skill:frontier-smol-handoff` or names the workflow. Not auto-loaded.

## Skill shape

Single file: `.claude/skills/frontier-smol-handoff/SKILL.md`.

- Frontmatter `name` + `description` (when-to-use only; no workflow summary)
- Role table
- Linear steps + the four hard gates
- Rationalization table and red flags (discipline skill)
- Contrast with `--plan-yolo`
- No extra agent definition, no project `prewalk.enabled` flip unless the user asks

## Testing (writing-skills TDD)

Discipline skill. RED: pressure scenarios without the skill. GREEN: same scenarios with the skill. REFACTOR: close loopholes from observed rationalizations.

Expected baseline failures: one-shot under time pressure; plan-then-smol because it looks cheaper; keep editing on frontier after the first change; hand a written plan to a `task` spawn.

## Non-goals

- Changing OMP defaults for this repo
- A custom project agent
- Auto-triggering on every multi-step task
- Replacing `writing-plans` / `executing-plans` for users who want those
