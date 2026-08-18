---
name: frontier-smol-handoff
description: Use when the user invokes /skill:frontier-smol-handoff or asks to explore on frontier then hand off to @smol / --prewalk. Also use when they name one-shotting, plan-yolo, or keeping the frontier model after the first edit as the problem.
---

# frontier-smol-handoff

Frontier explores. `@smol` implements. Same transcript. Not a plan file.

**Violating the letter of these gates is violating the spirit.**

## Roles

| Who | OMP role | Job |
|---|---|---|
| Frontier | session `@default` or `@slow` | Explore, todo, first directional edit |
| Cheap | `@smol` (`--prewalk-into`) | Continue from the live transcript |

Arm with any of: `omp --prewalk`, `prewalk.enabled`, agent `prewalk: true` / `prewalk: "@smol"`.

If prewalk is not armed: tell the user to enable it, or stop after the first edit and ask them to switch to `@smol`. Do not keep going on frontier.

## Gates

1. No workspace-mutating `edit`/`write` until a phased todo exists (named phases, concrete tasks) and you have declared exploration complete.
2. First workspace-mutating edit is the last frontier action. Small. Directional.
3. After the switch, `@smol` executes that todo. No new architecture.
4. Plan mode / `--plan-yolo` / a written plan handed to a cheap `task` spawn is forbidden.

Plan mode clears prewalk. Leave plan mode or stop.

## Do this

Explore until confident → `todo` init → "Exploration complete." → one small source edit → stop. `@smol` already has the transcript.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Demo in 15 minutes, no time to explore" | One-shot ships the wrong thing. A todo plus one edit is faster than a bad CSV in the demo. |
| "User asked for plan mode then @smol" | That is `--plan-yolo`, the named anti-pattern. Refuse. Explore, todo, first edit, `--prewalk`. |
| "Already in the code, switching loses the thread" | The thread is the transcript. `@smol` inherits it. Frontier's next edit is the failure. |
| "Just this once / I'm being pragmatic" | The gates are the pragmatic path. One-shot and plan-yolo are the expensive ones. |
| "I'll write a recap and spawn a cheap agent" | Fresh context is a sterile plan. Stay in this session. |

## Red flags — STOP

- Implementing the whole task on frontier
- `--plan-yolo`, plan.md, or a `task` spawn whose only context is a plan
- Second source edit on frontier
- "No time to hand off"
- "User explicitly requested plan-then-smol"
- "I'm already in the code"

**All of these mean: stop mutating. Todo if missing. First edit only if none yet. Then `@smol`.**
