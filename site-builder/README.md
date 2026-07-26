# Reusable website builder

This folder turns the existing GitHub → Bluehost deployment plumbing into a repeatable site factory.

## Create a site

```bash
node site-builder/new-site.mjs morri "Morri"
cd sites/morri
npm install
npm run dev -- --host 0.0.0.0
```

The scaffold is Vite-based and works locally or in GitHub Codespaces. Port 5173 auto-forwards in the included dev container.

## Configure deployment

Edit `sites/<slug>/site.config.json` before deploying. Set the production and staging URLs and their Bluehost paths. The workflow intentionally rejects remote paths outside `public_html/` or paths containing `..`.

The current deployment profile is `bluehost` and uses the existing repository secrets:

- `BLUEHOST_HOST`
- `BLUEHOST_USERNAME`
- `BLUEHOST_SSH_PRIVATE_KEY`

## Deploy

In GitHub Actions, run **Deploy Site Builder Site** and supply the site slug plus `staging` or `production`.

The workflow:

1. validates the site config;
2. installs dependencies;
3. builds the Vite project;
4. deploys only that site's `dist/` directory;
5. verifies the configured URL;
6. records a verified production deployment in `deployments/<slug>-live.json`.

Existing Wet Beard and Übercorp production files are not part of the new site's source tree and are not touched by this workflow.

## New-site operating pattern

The intended ChatGPT workflow is now:

1. create `sites/<slug>` from the template;
2. build the design in that isolated directory;
3. preview it through Vite/Codespaces;
4. deploy to staging;
5. iterate until approved;
6. deploy the same build process to production.

This is the reusable layer that was previously missing.
