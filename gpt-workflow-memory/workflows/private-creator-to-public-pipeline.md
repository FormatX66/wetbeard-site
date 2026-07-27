# Private Creator → AI → Review → Public Pipeline

## Use when
A website lets an owner submit raw notes/images/prompts privately and publish polished AI-assisted output publicly.

## Proven pattern
1. Private authenticated creator UI accepts raw material.
2. Preserve the original raw submission separately from generated metadata/output.
3. Call the AI server-side only; never expose API keys in browser JavaScript.
4. Request structured machine-readable output for catalog/episode plans.
5. Keep generated output a draft by default.
6. Let the creator edit/review before publication.
7. Require an explicit publish action.
8. Public APIs expose only approved/public fields, never private raw material.
9. Add a local/non-AI fallback where practical so basic authoring is not blocked by AI downtime.
10. Approved content becomes the source for public search/readers and, when continuity matters, the canonical future context.

## Examples
- Witchdix: raw private notes → AI catalog → explicit public grimoire publication.
- Xander: images/memes/prompts → canon-aware episode plan → generated art → approval → public comic/reel.

## Source history
Derived from PRs #38 and #44.