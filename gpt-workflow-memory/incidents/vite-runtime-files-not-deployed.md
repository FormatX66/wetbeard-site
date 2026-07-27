# Incident: Vite Build Omitted PHP Runtime Files

## Symptoms
- Frontend loaded after deployment.
- Admin/API/creator backend endpoints returned 404 or were absent.
- Source repository contained the PHP files, but `dist/` did not.

## Root cause
Vite only emits bundled frontend assets plus files copied from its `public/` directory. PHP/runtime files outside the build output were not automatically included.

## Working solution
- Add an explicit post-build copy step for server runtime files, or place static runtime assets in a deployable public/runtime path when appropriate.
- Keep persistent data directories outside destructive build output.
- Inspect the final `dist/` contents before deployment.

## Verification
- Confirm required PHP/API/admin files exist in `dist/`.
- Deploy to staging.
- Request each runtime endpoint and verify expected HTTP/JSON behavior.

## Keywords
Vite, PHP, dist, missing API, admin 404, postbuild, runtime files, deployment
