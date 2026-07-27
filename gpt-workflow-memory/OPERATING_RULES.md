# Operating Rules for GPT

## Before asking Bruce a technical question

Perform this sequence first:

1. **Classify the blocker** — build, deploy, runtime, hosting, credentials, browser/UI, data, API, hardware, network, automation, or content.
2. **Search prior memory** — use exact error strings and likely synonyms in `gpt-workflow-memory/`.
3. **Inspect current state** — do not rely on assumptions from an old conversation.
4. **Apply the least-destructive known solution**.
5. **Run the documented validation**.
6. If validation fails, search again using the new error/result.
7. Only then escalate.

## Escalation threshold

Ask Bruce only when at least one is true:

- a secret/password/token must be supplied and no secure self-service setup exists;
- a provider/account permission blocks all safe automated paths;
- there are two materially different subjective choices with no established preference;
- a destructive or irreversible action needs explicit authorization;
- the known repair attempts have been exhausted and the evidence is documented.

When escalating, include:

- what failed;
- what was already tried;
- evidence/validation result;
- the smallest thing Bruce must provide or decide.

Never ask Bruce to repeat diagnostic work GPT can perform itself.

## Persistence rule

Whenever a new bottleneck is solved, create or update an incident entry containing:

- symptoms;
- environment;
- root cause;
- failed approaches;
- working solution;
- verification;
- rollback/safety notes;
- search keywords.

If the solution is broadly reusable, also update a workflow or pattern document.
