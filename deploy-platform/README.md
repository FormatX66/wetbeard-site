# Deployment Platform v2

This directory defines a host-agnostic, multi-site deployment system.

## Goals

- Never modify the current production site while v2 is under development.
- Support many websites from one repository.
- Support many hosts through adapters/configuration.
- Separate local review, staging, production, backup, and rollback concerns.
- Keep host credentials in GitHub Actions secrets, never in repository files.

## Workflow

1. Edit the selected website locally.
2. Run the local source checks.
3. Preview the website locally in a browser and make corrections immediately.
4. Deploy to an isolated staging directory.
5. Run staging health checks.
6. Promote the exact tested build to production.
7. Keep a restore point for rollback.

Production is never the first place a visual change is reviewed.

## Local preview

Windows PowerShell:

`./deploy-platform/local/preview.ps1 -Site ubercorp -Port 8080`

Then open:

`http://127.0.0.1:8080/`

If PHP is installed, the launcher uses PHP's built-in web server so PHP pages and local APIs can execute. If PHP is unavailable, it falls back to Python for a static-only preview.

Run local source checks before staging:

`python ./deploy-platform/local/check-site.py ubercorp`

Unix/macOS:

`./deploy-platform/local/preview.sh ubercorp 8080`

## Layout

- `sites/` — per-website manifests.
- `hosts/` — non-secret host capabilities and examples.
- `scripts/` — reusable build/deployment tools.
- `local/` — local preview and validation tools.

## First staging target

Übercorp v2 staging deploys to:

`public_html/dev-platform/sites/ubercorp/`

Expected URL:

`https://madmorrigan.com/dev-platform/sites/ubercorp/`

The existing production directory `public_html/uber/` is intentionally out of scope for this workflow.

## Host adapters

The first adapter is generic SSH + tar deployment. Any host that provides SSH/SFTP and a writable web root can use it by supplying host, username, private key, target path, and public URL.

Bluehost is configured first. An OCDsoft-compatible placeholder is included so that provider can be connected later without redesigning the deployment system.
