# Workflow Memory Index

Search this file first, then open the matching incident/workflow.

| Area | Symptom / keywords | Reference |
|---|---|---|
| Website QA | build passes but page broken, blank, lines only, image missing, hotspot drift, mobile aspect ratio | `incidents/website-render-hotspot-validation.md` |
| Website architecture | Myst, rendered scene, clickable image, hotspot map, CSS vector looks bad, scene-first | `patterns/render-first-interactive-sites.md` |
| Vite + PHP | frontend deploy works but API/admin missing, PHP files not in dist | `incidents/vite-runtime-files-not-deployed.md` |
| Bluehost/cPanel | unknown document root, addon domain root, silent cPanel probe | `incidents/bluehost-document-root-discovery.md` |
| GitHub Actions | workflow says build success but runtime unverified, silent failure, need screenshots | `workflows/browser-validated-web-build.md` |
| Deployment safety | rsync --delete risks deleting persistent data | `incidents/rsync-persistent-data-protection.md` |
| AI backends | API key exposed risk, private creator backend, server-side OpenAI key | `patterns/server-side-ai-credentials.md` |

## Cross-project search keywords

`blank page`, `broken preview`, `aspect ratio`, `hotspot`, `SVG coordinates`, `rendered background`, `Playwright`, `Vite`, `PHP dist`, `Bluehost`, `cPanel`, `document root`, `rsync delete`, `OpenAI API key`, `staging`, `browser validation`, `screenshots`
