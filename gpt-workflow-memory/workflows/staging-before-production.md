# Staging Before Production

## Use when
A site has changed visually, structurally, or in its runtime behavior and production should not be touched blindly.

## Proven pattern
1. Build the production bundle locally/in CI.
2. Deploy to a dedicated staging path or review path.
3. Use the correct asset base for that path; a root-relative production base can break assets under `/staging/`.
4. Verify the staging URL over HTTP.
5. Run browser-level interaction/visual tests against staging.
6. Capture screenshots at representative aspect ratios.
7. Fix failures on a branch and redeploy staging.
8. Promote to production only after staging is verified.

## Representative viewports
- desktop 16:9
- desktop 3:2
- tablet landscape
- phone portrait
- phone landscape

## Rule
A successful rsync or build is not proof that staging works. The URL must load and the browser must exercise the important interactions.

## Source history
Derived from the realm staging work, rendered-scene review workflow, and ArkmatX browser validation.