# GPT Workflow Memory

Persistent, searchable memory for workflows, bottlenecks, failures, fixes, and proven operating procedures.

## Prime directive
Before asking Bruce for help with a technical blocker:

1. Search this knowledge base for the symptom, tool, platform, error text, and project type.
2. Read the closest matching incident/workflow.
3. Try the documented safe/reversible fix.
4. Validate the result using the documented verification step.
5. Record any new failure mode or improved fix here.
6. Escalate to Bruce only when:
   - no applicable prior solution exists;
   - the documented solution fails after validation;
   - credentials/permissions or a destructive choice require Bruce;
   - the requested decision is subjective and cannot safely be inferred.

Do not rediscover solved problems from scratch.

## Search strategy
Search broad to narrow:

- exact error text
- platform/tool name + symptom
- deployment/build/runtime category
- project type + failure mode
- known workaround names

Useful search terms are maintained in `INDEX.md` and each incident's `keywords` section.

## Structure

- `INDEX.md` — fast lookup table and keywords.
- `OPERATING_RULES.md` — rules GPT should follow before escalating.
- `workflows/` — reusable end-to-end procedures.
- `incidents/` — specific failures, root causes, fixes, and validation.
- `patterns/` — recurring engineering/design lessons.
- `templates/` — format for documenting future failures and workflows.

## Documentation rule
A fix is not complete until it contains a verification method. "It should work" is not a solution.
