# Pattern: Render-First Interactive Sites

## Requirement
For Myst-like, game-like, cinematic, or environmental websites, do not construct the visual world out of CSS boxes/vector furniture unless explicitly requested.

## Architecture

1. Render or illustrate the complete scene first.
2. Use that scene as the visual background/canvas.
3. Add animation as overlays/layers: rain, fog, light flicker, CRT scan, particles, parallax.
4. Add transparent SVG/polygon hotspots aligned to real objects in the scene.
5. Keep hotspot coordinates in the same native coordinate system as the scene art.
6. Clicking a hotspot may:
   - reveal information;
   - trigger animation/state;
   - open a real project/link;
   - transition to another rendered location;
   - participate in a puzzle.
7. Responsive handling should preserve scene/hotspot alignment. Use letterboxing or controlled pan/crop of the combined scene rather than independent scaling.

## Design rule
The visitor should feel like they are looking into a place, not looking at a themed dashboard.

## ArkmatX-specific lesson
Wet Beard is a linked project inside ArkmatX, not ArkmatX's identity. The Wet Beard object is an e-bike/bicycle project prop and link, not a motorcycle or site-wide brand.

## Keywords
Myst, point and click, rendered background, image map, polygon hotspots, cinematic website, game interface, environmental UI
