# Incident: Rendered Website Looked Broken Despite Successful Build

## Symptoms
- Page appeared as lines/overlays with no background.
- Some versions loaded simple CSS/vector graphics instead of the intended rendered scene.
- Hotspots worked at one aspect ratio but drifted or became unreachable on others.
- Build tooling reported success even though the real user experience was broken.

## Environment
ArkmatX rendered-scene rebuild, Vite, SVG/bitmap scene assets, SVG hotspot map, GitHub Actions.

## Root causes
1. Background asset was referenced externally/relatively in a preview that did not carry the asset with it.
2. Visual scene and hotspot geometry were scaled/cropped using different rules.
3. `preserveAspectRatio`/cover-style cropping could put hotspot regions outside the visible viewport.
4. Validation checked compilation rather than actual browser rendering.
5. Early scene art was CSS/DOM-generated even though the design requirement was render-first.

## Failed approaches
- Assuming a successful Vite build meant the page worked.
- Opening a standalone HTML file with a sibling image dependency that was not guaranteed to materialize with it.
- Using cover/crop for the image while independently stretching an SVG hotspot layer.
- Replacing high-detail renders with CSS vector furniture/room shapes.

## Working solution
- Treat the rendered scene as the source visual.
- Keep scene and hotspot map on the same fixed coordinate canvas.
- Scale them together.
- Prefer letterboxing/controlled camera panning over independent cropping.
- Use transparent SVG polygons/rects/ellipses only as the interaction layer, not as the artwork.
- Run Playwright against the production build.
- Test desktop, tablet, portrait phone, and landscape phone.
- Capture and inspect screenshots.
- Validate hotspot bounds and actual interaction behavior.

## Verification
A browser-level validation run must pass all target viewports with:
- rendered scene loaded;
- no unexpected browser/HTTP errors;
- hotspots in visible bounds;
- primary interactions clickable;
- scene transitions functioning;
- screenshots captured for inspection.

ArkmatX PR #56 established the reusable validation pattern.

## Prevention
Before handing a website to Bruce for review, never rely only on source inspection or build success. Browser-test and visually inspect the rendered result.

## Keywords
blank page, lines only, background missing, rendered scene, hotspot drift, SVG map, aspect ratio, preserveAspectRatio, cover crop, mobile, Playwright, screenshot, Vite
