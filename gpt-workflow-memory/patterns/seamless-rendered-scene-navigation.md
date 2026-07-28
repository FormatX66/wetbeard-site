# Seamless rendered-scene navigation

## Purpose

Move between already-rendered rooms without reloading the page, while preserving the render-first scene/hotspot architecture, local puzzle state, browser history, and deep links.

## Pattern

1. Keep physical room changes driven by the existing hotspot polygons and scene renderer.
2. Add one in-page navigation request event for secondary controls such as journals or mission compasses.
3. Resolve that request back through the physical scene hotspot instead of duplicating rendering logic.
4. Synchronize `?scene=` with `history.pushState` after ordinary travel and `replaceState` during initial restoration.
5. Handle `popstate` by routing through the same hotspot path without creating another history entry.
6. Preserve a URL fallback when the in-page navigator has not initialized.
7. Keep per-login expedition state separate from shared world-bus flags.

## Validation

Real-browser coverage should verify on desktop and phone that:

- physical hotspot travel changes the room and URL without unloading the page;
- browser Back returns to the prior rendered room without unloading;
- field-journal travel stays in-page;
- mission-compass routing stays in-page;
- a runtime-only JavaScript marker survives every room change;
- raster scenes and hotspot alignment remain covered by the normal five-viewport suite.

## Failure mode avoided

Do not let convenience controls navigate with `location.href` while physical hotspots use the in-page renderer. That splits room travel into two behaviors, resets transient puzzle state, causes visible reloads, and makes browser history inconsistent.
