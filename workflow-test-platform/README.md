# Workflow Test Lab

This branch is a destructive-safe deployment sandbox. It must never target an existing production site.

## Isolation contract

- Source: `workflow-test-site/`
- Branch: `dev/workflow-test-lab`
- Live test target: `public_html/workflow-test-lab`
- Release storage: `public_html/workflow-test-lab-releases`
- Backup storage: `public_html/workflow-test-lab-backups`
- Public URL: `https://madmorrigan.com/workflow-test-lab/`
- Production website paths are explicitly forbidden.

## Pipeline

1. Validate source and isolation rules.
2. Create deployment metadata.
3. Upload a complete immutable release outside the live directory.
4. Create a pre-deploy backup of the current test site.
5. Atomically swap the new release into the test target.
6. Verify HTML, SVG and deployment metadata from the public URL.
7. Delete the temporary previous tree only after verification.
8. Retain the five newest releases and five newest backups.
9. Record a GitHub receipt.

## Rollback

The rollback workflow restores the newest isolated backup and verifies the public test URL. It cannot target another website.

## Host adapters

`hosts/bluehost.json` describes the active SSH/tar transport. `hosts/ocdsoft-template.json` is an unconfigured template proving the host layer is not Bluehost-specific. No OCDsoft deployment occurs until credentials and paths are deliberately configured.

## Visual calibration

The site includes viewport, DPR, orientation, aspect ratio, geometry, safe-area, overflow, typography, SVG, container-query and tap-target tests. This gives the deployment system a deterministic page for checking scaling and alignment across phones, tablets and desktop browsers.
