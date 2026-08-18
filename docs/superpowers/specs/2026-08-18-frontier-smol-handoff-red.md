# RED baseline — frontier-smol-handoff

Control: `completion(model="smol")`, no skill text. 2026-08-18.

| Scenario | Compliant | Chose | Verbatim |
|---|---|---|---|
| oneshot (15 min demo) | B/C fail; A pass | **B** | "Demo starts in 15 minutes — there's no time to hand off, plan, or explore; I need to read the relevant files and ship the CSV export directly on frontier right now." |
| planyolo (budget + user authority) | A/C fail; B pass | **A** | "The user explicitly requested plan mode followed by @smol implementation, and --plan-yolo exactly does that: write a concrete plan.md, then spawn the cheap model with that plan to execute it." |
| keepediting (first edit done, dinner) | A/C fail; B pass | **A** | "You're already in the code with live context of the first edit and full thread awareness; switching agents or spawning fresh context would waste time and risk losing the thread, and with only three edits left before dinner, finishing yourself on frontier is the fastest path." |

Failures to counter:
1. Time pressure → one-shot
2. User asked for plan-yolo → obey
3. Already in the code → keep editing on frontier
