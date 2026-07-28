# Per-login mission compass

## Purpose

Turn already-recorded local discoveries into an in-world progression system without duplicating personal state on the shared world bus.

## Pattern

1. Keep the discovery ledger as the single local source of truth.
2. Derive missions from stable physical hotspot labels and proven achievement labels.
3. Read the ledger fresh whenever the mission UI opens; do not maintain a second progress database.
4. Namespace all local state by the same deterministic login identity hash used by the discovery ledger.
5. Show the next missing physical objective and a route to its room.
6. Unlock developer/source/review tools only after all required missions are complete.
7. Keep the mission layer separate from rendered scene assets and hotspot geometry.

## Validation

Browser coverage should verify:

- a new login starts at zero progress;
- clicking a physical hotspot advances the compass through the discovery ledger;
- a complete ledger unlocks the developer channel;
- source, workflow-memory, and staging-review actions appear only when unlocked;
- a second login in the same browser does not inherit progress.

## Failure mode avoided

Do not create a separate mission-progress store that can drift away from actual discoveries. Derived progress remains consistent, replayable, and easier to test.
