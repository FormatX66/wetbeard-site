# Generated scene wrapped in dashboard chrome

## Symptom

An image-generation request for a clean cinematic website environment repeatedly returns a status dashboard, mock browser, labels, hotspot circles, or other baked interface chrome around the otherwise useful scene.

## Do not

- Do not regress to CSS/vector scenery just to keep moving.
- Do not use the full dashboard image as the website background.
- Do not rebuild the validated hotspot engine around the generated mockup.

## Recovery workflow

1. Identify a clean rectangular portion containing only the useful environment.
2. Crop it to the target scene aspect ratio, normally 16:9.
3. Remove generated hotspot markers or interface remnants with local inpainting/retouching.
4. Export a browser-safe JPEG.
5. Place the raster behind the existing hotspot SVG instead of baking interactions into the image.
6. Use a small compatibility module when changing the main scene engine would be riskier than swapping the active background asset.
7. Run staging deployment and the full real-browser viewport gate before merging.

## ArkmatX example

The server-closet generator repeatedly returned a build-status dashboard. The useful room was cropped and cleaned, exported as `servers-render.jpg`, and loaded only when the existing `SERVERS` scene became active. Existing server-node, workshop-return, and paradox-transition hotspots remained unchanged.

## Validation

- PR-based staging deployment succeeds.
- The active server scene uses `servers-render.jpg` rather than the vector fallback.
- Desktop, tablet, portrait-phone, and landscape-phone browser checks pass.
- Production remains untouched until a separately approved promotion.
