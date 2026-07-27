# Incident: Render Asset Generation Temporarily Unavailable

## Symptom
A render-first site needs a new cinematic raster scene, but the image-generation dependency errors before producing an asset.

## Bad fallback
Do not replace the missing render with CSS boxes, vector furniture, or a dashboard-style scene just to keep moving. That violates the render-first architecture and creates rework.

## Safe response
1. Keep the last known-good rendered/staging experience intact.
2. Do not repeatedly hammer the failing image-generation dependency in the same run.
3. Prepare non-visual infrastructure that does not change the approved aesthetic: scene manifest support, chunked raster loading, hotspot plumbing, tests, staging hooks.
4. Preserve the existing scene only as a temporary compatibility fallback until the real raster asset exists.
5. Retry asset generation on a later run/new request.
6. Once the raster exists, register it in the render manifest, remap hotspots to visible objects, run five-viewport browser validation, and deploy to staging before merging further visual work.

## ArkmatX implementation
ArkmatX uses `sites/arkmatx/public/scenes/render-manifest.json` plus chunked base64 raster parts. Adding a rendered secondary room should require asset chunks + a manifest entry, not another loader rewrite.

## Keywords
image generation failed, render unavailable, raster dependency, render-first blocker, no vector fallback, scene manifest, chunked raster
