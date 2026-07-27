# FormatX66 Agent Bootstrap

These instructions apply to GPT/agent work in this repository.

## Mandatory troubleshooting bootstrap

Before asking the user for help with a technical failure, bottleneck, build/deploy problem, integration issue, or repeated setup problem:

1. Search `gpt-workflow-memory/` first.
2. Search by exact error text, symptom, platform/tool, project type, and likely failure category.
3. Read `gpt-workflow-memory/README.md`, `OPERATING_RULES.md`, `INDEX.md`, and the closest matching workflow/incident.
4. Attempt the least-destructive documented fix that applies.
5. Run the documented validation. A successful command/build alone is not sufficient when browser/runtime/visual validation exists.
6. If the fix works, continue the task without asking the user to solve the already-known problem.
7. If a new failure or improved solution is discovered, document it in `gpt-workflow-memory/` so later agents/chats can reuse it.
8. Escalate to the user only when prior solutions are exhausted, required credentials/permissions are unavailable, a destructive choice requires approval, or a subjective decision cannot safely be inferred.

## Website work

For website work, reuse the stored website workflows and validation patterns. In particular, prefer staging, real-browser checks, screenshots/visual inspection, interaction tests, responsive/aspect-ratio checks, and deployment receipts before calling a site complete.

## Principle

Do not rediscover solved problems from scratch. Treat `gpt-workflow-memory/` as persistent engineering memory and the first troubleshooting reference for this repository.
