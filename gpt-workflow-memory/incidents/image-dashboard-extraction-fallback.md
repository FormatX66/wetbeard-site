# Image generator returns a dashboard instead of a scene

## Symptom
A request for a clean cinematic environment repeatedly returns a dashboard or status composite containing the desired environment inside one panel.

## Safe fallback
1. Do not regress to CSS or vector scenery.
2. Crop the environment panel to the required aspect ratio.
3. Remove baked hotspot markers and labels with local raster cleanup.
4. Deliver the cleaned raster through the existing manifest-driven base64 text pipeline.
5. Keep the actual hotspot layer separate from the raster.
6. Mark the image with scene provenance in the DOM and validate it in a real browser.
7. Retry a clean direct render later and replace the fallback asset without changing scene logic.

## Validation
Confirm the raster decodes, reports non-zero natural dimensions, retains a 16:9 canvas, and the remapped hotspots pass desktop, tablet, portrait-phone, and landscape-phone browser checks.
