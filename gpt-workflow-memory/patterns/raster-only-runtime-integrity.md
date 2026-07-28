# Raster-only runtime scene integrity

## Purpose

Keep a render-first interactive site from silently flashing or falling back to obsolete SVG/CSS scene art when a raster chunk, compatibility module, or decode step misbehaves.

## Pattern

1. Treat the render manifest as the only source of truth for cinematic scene backgrounds.
2. Preload and decode registered raster scenes before they are needed.
3. Swap a scene only after its raster reports non-zero natural dimensions.
4. Hide legacy vector fallbacks from the visitor; show a neutral in-world acquisition signal instead.
5. Retry transient manifest/chunk/decode failures with bounded exponential backoff.
6. Keep the hotspot SVG layer separate and unchanged so interaction geometry remains stable.
7. Remove obsolete compatibility modules that can overwrite a manifest raster with a stale asset path.
8. Expose a small runtime snapshot for browser validation: active scene, raster state, provenance, dimensions, and whether a vector fallback is active.

## Validation

- Open the workshop and verify the active source is a decoded `data:image/*` raster.
- Navigate through the physical Server Closet hotspot and verify the server scene settles to `ready` with non-zero dimensions.
- Navigate through the physical Paradox hotspot and verify the paradox scene settles to `ready`.
- Confirm no active scene source ends in `.svg`.
- Confirm the stale compatibility module is not loaded.
- Run the existing five-viewport visual suite to ensure the raster and hotspot canvases remain aligned.

## Failure mode avoided

A previous scene-specific compatibility module could override the manifest-driven server raster after navigation. Build-time success alone did not prove that the browser kept the correct rendered source active. The runtime guard makes raster provenance explicit and converts transient asset trouble into a retrying in-world loading state rather than a visual regression.
