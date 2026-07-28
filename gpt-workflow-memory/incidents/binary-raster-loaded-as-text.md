# Incident: Binary raster loaded through the base64-text path

## Symptom

A browser reports that a JPEG decoded successfully and has non-zero dimensions, but the rendered scene contains large flat gray blocks, partial image strips, or dashboard fragments. Build and viewport checks may still pass because the image element technically loaded.

## Root cause

The scene manifest used a generic `file` field that the loader interpreted as UTF-8 text containing base64. The referenced file was not the approved browser-safe binary raster. A different text extraction decoded into a technically valid but visually corrupt JPEG, so natural-dimension checks were insufficient.

## Safe fix

1. Distinguish manifest source types explicitly:
   - `asset`: direct binary browser asset such as `.jpg`, `.png`, or `.webp`.
   - `file` / `prefix` + `parts`: UTF-8 files whose contents are base64 text.
2. Never call `response.text()` on a binary raster.
3. Preload and decode the direct asset URL before swapping it into the active scene.
4. Record expected natural dimensions in the manifest when they are known.
5. Validate the exact active source URL and provenance, not only `naturalWidth > 0`.
6. Add a lightweight pixel-distribution check to catch large flat-gray corruption that still decodes.
7. Inspect the uploaded browser screenshot artifact before merging a visual recovery.

## ArkmatX example

The server room manifest pointed to `server-room.part2.txt`, which decoded as a 400×225 JPEG but displayed a partial server strip over large gray blocks. The approved clean raster already existed as `public/scenes/servers-render.jpg` (256×144). The manifest now declares it as a direct `asset`, and the browser gate requires that exact source, dimensions, raster provenance, and reasonable sampled color variation.

## Keywords

binary raster, response.text JPEG, valid decode corrupt image, gray blocks, partial render, manifest asset, base64 text file, pixel distribution, screenshot artifact inspection
