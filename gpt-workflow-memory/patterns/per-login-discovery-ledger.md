# Per-Login Discovery Ledger

## Use when
A rendered interactive site should remember which physical objects each login has examined without sending personal exploration history to shared server state.

## Proven pattern
1. Reuse the same explicit login or anonymous visitor identity used by visual variants and expedition memory.
2. Hash the identity before forming local-storage keys.
3. Record semantic hotspot labels, room names, first/last seen timestamps, and repeat counts.
4. Keep discoveries local and separate from shared world-bus flags.
5. Listen on the stable SVG hotspot container so dynamically rebuilt polygons remain covered.
6. Surface the record through an in-world ledger rather than a debug/settings page.
7. Include special local achievements only when existing UI state proves they occurred.
8. Test same-login persistence and cross-login isolation in a real browser.

## Important failure modes
- Do not attach click handlers individually only once; room transitions replace the SVG polygon children.
- Do not use rendered coordinates as discovery identifiers. Use stable semantic labels plus room name.
- Do not store personal discovery history in the shared cross-site world bus.

## Source history
Introduced for ArkmatX after rendered rooms, per-login variants, expedition resume, and keyboard hotspot navigation were already validated.
