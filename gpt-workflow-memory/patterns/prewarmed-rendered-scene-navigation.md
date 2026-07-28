# Prewarmed Rendered Scene Navigation

## Use when

- A Myst-style site swaps large raster rooms through chunked base64 payloads.
- The current room remains visible too long while the next room downloads.
- A transition can briefly look blank, stale, or unresponsive even though the eventual image is valid.
- Scene payloads are fetched with `cache: no-store`, so normal browser HTTP caching does not make repeat navigation instant.

## Pattern

1. Install a narrow in-memory `fetch` wrapper for scene manifest and base64 text payloads only.
2. Preserve the native `fetch` path for every non-scene request.
3. Deduplicate in-flight scene requests and return fresh `Response` objects from the stored bytes.
4. After the active visual variant is known, preload and decode every rendered room in the manifest.
5. Preload any direct compatibility raster that can replace a manifest-rendered image.
6. On physical scene-hotspot activation, mark the viewport `aria-busy=true` and show an explicit loading transition.
7. Clear the loading state from the image `load` or `error` event, with a timeout failsafe so the interface never remains blocked.
8. Expose a small diagnostic object for browser tests: cache status, hits, misses, entries, preloaded rooms, errors, and latest load duration.

## Validation

- The cache reaches `ready` and reports every expected room as decoded.
- Navigating to secondary rooms increments cache hits rather than misses.
- `aria-busy` and the loading overlay clear after each room transition.
- The destination raster has non-zero natural dimensions.
- Existing hotspot, variant, expedition-memory, and puzzle tests remain green.

## Safety

- Cache only same-origin scene payloads under `/scenes/`.
- Do not cache world-state APIs, activity feeds, GitHub telemetry, or mutable user data.
- Keep production untouched until the staging deploy and complete browser suite pass.
