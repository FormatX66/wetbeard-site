# Shared Cross-Site State Workflow

## Use when
Several sites need discoveries/actions in one site to persist and affect the others.

## Proven pattern
1. Start with a lightweight local/browser passport only as a compatibility layer.
2. Add a small server-side state service when state must persist across devices/sessions/sites.
3. Allow-list symbolic flags/counters rather than accepting arbitrary user-provided storage keys.
4. Restrict CORS to the known connected origins.
5. Make writes identify their source realm/site.
6. Let clients degrade safely to local state if the server bus is unavailable.
7. Sync old/local flags into persistent state through a compatibility bridge rather than rewriting every site at once.
8. Store only game/project state; do not turn the bus into a personal-data profile system without a separate design/security review.

## Deployment requirement
The state endpoint must live on a verified server root and its data file/directory must be excluded from destructive deploy syncs.

## Source history
Derived from the realm passport/world-bus architecture in PR #41 and related realm work.