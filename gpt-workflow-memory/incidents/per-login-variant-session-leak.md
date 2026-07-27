# Per-login visual variant leaked across identities

## Symptom

A site assigns a stable visual variant to a login, but switching to another explicit login in the same browser session keeps the first login's visual build.

## Cause

The chosen variant was cached under one session-wide key. Variant selection checked that cache before hashing the current login identity, so a new identity inherited stale state.

## Safe fix

Before the application selects a variant:

1. Read the explicit login identity from the URL or authentication bootstrap.
2. Compare it with the identity associated with the cached session variant.
3. If the identity changed, clear only the cached active variant.
4. Save the new active identity.
5. Let the normal manifest-driven selector deterministically assign the new login.

Do not clear unrelated world progress, passport flags, achievements, or other persistent state.

## Validation

Use one browser context and verify all three behaviors:

- login A receives its deterministic variant;
- switching to login B produces B's variant instead of A's cached variant;
- query-free navigation after login B keeps B's variant.

Also rerun the normal viewport, room-navigation, and rendered-scene checks.

## ArkmatX implementation

ArkmatX performs the identity guard in `sites/arkmatx/index.html` before the module application boots. Browser coverage lives in `sites/arkmatx/tests/variant-smoke.mjs`.
