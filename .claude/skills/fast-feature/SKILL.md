---
name: fast-feature
description: Fast, low-token workflow for adding features or making changes to this project. Use when the user invokes /fast-feature, asks for direct or fast execution, or requests a feature without asking for the full design process. Supersedes the process skills (brainstorming, writing-plans, subagent-driven-development) for work estimated at half a day or less.
---

# Fast Feature Workflow

Implement directly in the current session: no subagents, no plan documents,
no process pipeline. Speed and token economy are the point.

## Workflow

1. **Clarify inline — at most 2 questions.** Ask only when the answer changes
   the design, one at a time. Otherwise make the obvious call and state it in
   the final summary.

2. **Scope check.** Half a day or less → proceed. Bigger, or it restructures
   `src/lib/content/parser.ts` / cross-site data → pause, say so, and offer a
   10-minute file-list-and-interfaces outline before coding (still no full
   plan document unless the user asks for one).

3. **Code directly.** Small safe patches; read a file before editing it;
   match existing patterns. Never touch `content/raw/`, `README.md`, or the
   user's uncommitted files (`scripts/*.png`, `.claude/settings.json`, etc.).

4. **Verify once, after the code is done** — not after every edit:

   - `npm run test:run`
   - `npm run lint`
   - `npm run build`

   If a check fails, fix and re-run only the affected check.

5. **Commit** — one commit per coherent change, conventional message, ending
   with `Co-Authored-By: Claude Code <noreply@anthropic.com>`. Do not push
   unless asked.

6. **Report in Simplified Chinese** with the project output contract:
   改动摘要 / 涉及的文件路径 / 已运行的验证命令及结果 / 未验证的内容.
   List the visual checks for the user to confirm on their dev server at
   :3000 (never start a second server). If the session has run long, suggest
   /clear before starting the next feature.

## Test policy

- Keep the existing suite green; never delete tests to make a change pass.
- Add new tests only for tricky pure logic (parsing rules, packing/clamping
   math, state restore). Skip tests for copy, CSS, and wiring changes.
- No TDD ceremony: no RED/GREEN evidence steps, no per-task test reports.

## Token discipline

- No subagent dispatches (each costs 30k-60k tokens and serializes
  wall-clock).
- Do not re-read files already in context; quote `file:line` instead of
  pasting code into replies.
- Prefer targeted Grep (`-n`, `-o`, head_limit) over reading whole files.
- Do not invoke other skills mid-task unless the user asks.
