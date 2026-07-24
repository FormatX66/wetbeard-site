# Deployment Platform v2

This directory defines a host-agnostic, multi-site deployment system.

## Goals

- Never modify the current production site while v2 is under development.
- Support many websites from one repository.
- Support many hosts through adapters/configuration.
- Separate staging, production, backup, and rollback concerns.
- Keep host credentials in GitHub Actions secrets, never in repository files.

## Layout

- `sites/` — per-website manifests.
- `hosts/` — non-secret host capabilities and examples.
- `scripts/` — reusable deployment and validation tools.

## First staging target

Übercorp v2 staging deploys to:

`public_html/dev-platform/sites/ubercorp/`

Expected URL:

`https://madmorrigan.com/dev-platform/sites/ubercorp/`

The existing production directory `public_html/uber/` is intentionally out of scope for this workflow.

## Host adapters

The first adapter is generic SSH + tar deployment. Any host that provides SSH/SFTP and a writable web root can use it by supplying host, username, private key, target path, and public URL.

Bluehost is configured first. An OCDsoft-compatible placeholder is included so that provider can be connected later without redesigning the deployment system.
