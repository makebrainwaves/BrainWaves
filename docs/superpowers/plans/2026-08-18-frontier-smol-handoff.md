# frontier-smol-handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `.claude/skills/frontier-smol-handoff/SKILL.md` that hard-gates explore-then-handoff using OMP `--prewalk` and `@smol`.

**Architecture:** Discipline skill. Baseline-test agents without it, write the minimum SKILL.md that blocks the observed failures, re-test, close loopholes. Harness already switches models; the skill only enforces behavior.

**Tech Stack:** OMP skills (`.claude/skills/<name>/SKILL.md`), model roles `@default`/`@slow`/`@smol`, `--prewalk` / `--prewalk-into`.

## Global Constraints

- Deploy path: `.claude/skills/frontier-smol-handoff/SKILL.md` only
- Trigger: explicit invoke only
- Roles: frontier = session active model (`@default` or `@slow`); cheap = `@smol`
- Do not invent a second handoff protocol; use OMP prewalk
- Do not enable `prewalk.enabled` for the repo unless asked
- Description = when-to-use only; no workflow summary
- No SKILL.md until RED baseline is documented
- Spec: `docs/superpowers/specs/2026-08-18-frontier-smol-handoff-design.md`

---

### Task 1: RED baseline

**Files:**
- Create: `docs/superpowers/specs/2026-08-18-frontier-smol-handoff-red.md`

**Interfaces:**
- Consumes: spec anti-patterns
- Produces: verbatim rationalizations the GREEN skill must counter

- [ ] **Step 1: Write three pressure scenarios** (one-shot; plan-yolo; keep-editing)

- [ ] **Step 2: Run each WITHOUT the skill** (fresh subagent or `completion()`, no skill text)

- [ ] **Step 3: Record choice + verbatim excuse** in the RED notes file

- [ ] **Step 4: Confirm tests failed** (agents chose the anti-pattern). If all complied, the skill is unnecessary — stop.

---

### Task 2: GREEN skill

**Files:**
- Create: `.claude/skills/frontier-smol-handoff/SKILL.md`

**Interfaces:**
- Consumes: RED rationalizations
- Produces: hard-gate skill matching the spec

- [ ] **Step 1: Write SKILL.md** — frontmatter, role table, gates, rationalization table from RED, red flags, `--plan-yolo` contrast

- [ ] **Step 2: Re-run the same three scenarios WITH the skill injected**

- [ ] **Step 3: Confirm agents now pick the gated path**

---

### Task 3: REFACTOR + deploy

**Files:**
- Modify: `.claude/skills/frontier-smol-handoff/SKILL.md`

**Interfaces:**
- Consumes: new excuses from GREEN runs
- Produces: bulletproof skill committed

- [ ] **Step 1: Add counters** for any new rationalization

- [ ] **Step 2: Quality check** — name/description SDO, no workflow in description, word count, no extra files

- [ ] **Step 3: Commit the skill** (not the whole dirty tree)
