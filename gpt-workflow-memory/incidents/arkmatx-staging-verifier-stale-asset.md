# ArkmatX staging verifier checks obsolete asset

## Symptom
ArkmatX source and browser validation pass, but the staging deployment receipt does not refresh or the staging workflow fails after the workshop scene implementation changes.

## Cause
The staging workflow continued to require and HTTP-check `scenes/workshop.svg` after the workshop changed to a reconstructed raster scene loaded from `workshop-render.part0.txt`, `part1.txt`, and `part2.txt`.

## Fix
Update deployment and HTTP verification to check the assets actually used by the current implementation. For chunked raster delivery, verify every chunk exists and is non-empty, concatenate them, base64-decode the result, and verify the decoded bytes begin with the JPEG SOI signature (`FFD8`).

## Rule
Deployment verification must track the runtime source of truth. When an asset architecture changes, update staging/production verification in the same change or the deploy pipeline can report false failures.
