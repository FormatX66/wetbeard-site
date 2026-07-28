# Per-Login Expedition Memory

## Use when
A rendered interactive site assigns visual variants per login and should also remember room progress without turning the shared world-state service into a personal profile database.

## Proven pattern
1. Derive a stable browser identity from an explicit `login`/`user` parameter or an anonymous visitor UUID.
2. Hash the identity before using it in local-storage keys.
3. Store only local game navigation state: last room, visited rooms, and update time.
4. Keep this state separate from shared symbolic world-bus flags.
5. Restore the saved room only after the initial scene and hotspot layer have mounted.
6. Preserve a `scene=` override for QA and a `noresume=1` escape hatch.
7. Provide an in-world journal rather than exposing storage/debug controls as a normal settings page.
8. Test login isolation, same-login resume, visited-room navigation, and mobile/desktop compatibility in a real browser.

## Important failure modes
- Do not record the initial workshop before reading/restoring the saved last room. Doing so overwrites the very state being restored and makes resume appear unreliable.
- Do not assume an SVG hotspot supports the `HTMLElement.click()` helper. Programmatic room restoration should dispatch a bubbling `MouseEvent('click')` through the existing hotspot handler, then re-check the current room until navigation completes.

## Source history
Introduced for ArkmatX after the rendered workshop, server closet, paradox room, and per-login visual variants were already validated. The SVG activation note was added after the first expedition-memory browser gate timed out while the visual scene itself remained healthy.