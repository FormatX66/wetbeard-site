# Secondary rendered-scene browser validation

Use this after replacing a vector fallback with a raster scene or after remapping a secondary room.

1. Enter the room through the same hotspot a user clicks.
2. Verify the location label and `data-scene` provenance.
3. Confirm the image reports non-zero natural dimensions.
4. Verify the room exposes every required hotspot label.
5. Exercise at least one meaningful interaction sequence inside the room.
6. Capture screenshots at desktop 16:9, desktop 3:2, tablet landscape, phone portrait, and phone landscape.
7. Fail the PR if the rendered scene, navigation, hotspots, or interaction sequence breaks at any viewport.

For the ArkmatX paradox room, the canonical logic validation is Terminal A on, Terminal B off, Terminal C on, followed by Maintenance Channel.
