# Raster text payload decodes partially or shows gray bands

## Symptom

A raster transferred through manually copied base64 text appears to load in the browser and reports valid natural dimensions, but the lower portion is gray, missing, or visibly corrupted. A basic image-load assertion can pass even though the JPEG payload is damaged.

## Root cause

One or more characters in the base64 payload changed during transfer. JPEG decoders can recover the header and part of the scan data, so `complete`, `naturalWidth`, and `naturalHeight` are not sufficient proof of payload integrity.

## Reliable recovery

1. Export a browser-safe JPEG locally.
2. Base64-encode the file.
3. Store the encoded payload in text files consumed by the manifest-driven raster loader.
4. Compute the expected Git blob SHA for every text payload before upload:

   `sha1("blob " + byte_length + "\\0" + content)`

5. Fetch the committed file and compare its Git blob SHA to the expected value.
6. Do not switch the render manifest to the new payload until the SHA matches exactly.
7. Add a real-browser scene check that visits the room, verifies the data URI, captures screenshots, and fails on visual/runtime errors.

## Practical fallback

When a large manually transferred payload cannot be trusted, first ship a smaller exact single-part payload, verify its Git blob SHA, and use it as the safe staging render. Upgrade resolution later using multiple individually verified chunks.

## ArkmatX example

The first paradox-room JPEG appeared to load but produced a large gray band. The direct binary and initial eight-part payloads were not byte-identical to the local file. A smaller exact `paradox-single.part0.txt` payload was uploaded, its committed Git blob SHA matched the locally calculated SHA, and the paradox room then filled the viewport correctly across all five browser profiles.
