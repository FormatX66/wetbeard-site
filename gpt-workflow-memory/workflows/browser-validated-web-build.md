# Workflow: Browser-Validated Website Build

## Use when
Building or modifying any interactive website, especially image-heavy, scene-based, mobile-responsive, or deployed sites.

## Procedure

1. Confirm the intended visual/interaction architecture.
2. Build source.
3. Build production bundle.
4. Deploy to staging, not production.
5. Launch a real browser test against the built/staged result.
6. Test at minimum:
   - desktop 16:9;
   - desktop 3:2;
   - tablet landscape;
   - phone portrait;
   - phone landscape.
7. Verify:
   - primary visual asset loaded and has nonzero rendered size;
   - no unexpected browser console errors;
   - no unexpected HTTP failures;
   - primary interactions are clickable;
   - overlays/modals open and close;
   - scene/page transitions work;
   - hotspots remain within the visible rendered scene;
   - persistent/runtime endpoints do not break the page if unavailable.
8. Capture screenshots for each viewport.
9. Inspect screenshots, not just test exit code.
10. Fix failures and rerun from step 3.
11. Promote only after real-browser validation passes.

## Rule
A successful compiler/build is not proof that the website works.

## Automation reference
ArkmatX introduced a Playwright visual gate in PR #56 of `FormatX66/wetbeard-site`. Reuse that approach before inventing a new QA harness.

## Search keywords
Playwright, visual QA, blank page, mobile, screenshot, browser test, aspect ratio, hotspot, production bundle, staging
