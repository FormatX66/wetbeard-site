# Workflow Memory Index

Search this file first, then open the matching incident/workflow.

| Area | Symptom / keywords | Reference |
|---|---|---|
| Website QA | build passes but page broken, blank, lines only, image missing, hotspot drift, mobile aspect ratio | `incidents/website-render-hotspot-validation.md` |
| Website architecture | Myst, rendered scene, clickable image, hotspot map, CSS vector looks bad, scene-first | `patterns/render-first-interactive-sites.md` |
| New site setup | scaffold, new website, isolated site, site.config, Vite generator | `workflows/reusable-site-scaffold.md` |
| Staging | review build, staging path, asset base, mobile review, do not touch production | `workflows/staging-before-production.md` |
| Production promotion | deploy live, verified URL, deployment receipt, promote staging | `workflows/production-promotion-and-receipt.md` |
| Live app verification | homepage works but app broken, health endpoint, writable storage, protected route, smoke test | `workflows/live-health-endpoint-and-smoke-test.md` |
| Shared host config | .htaccess, host-wide rule, custom 404, preserve unrelated rules, managed block | `workflows/surgical-shared-host-config-edit.md` |
| Vite + PHP | frontend deploy works but API/admin missing, PHP files not in dist | `incidents/vite-runtime-files-not-deployed.md` |
| Bluehost/cPanel | unknown document root, addon domain root, silent cPanel probe | `incidents/bluehost-document-root-discovery.md` |
| Bluehost domain recovery | addon domain absent, alias/parked domain, cPanel creation failure, fallback path | `workflows/domain-root-and-addon-domain-recovery.md` |
| GitHub Actions | workflow says build success but runtime unverified, silent failure, need screenshots | `workflows/browser-validated-web-build.md` |
| CI guardrails | README falsely trips forbidden path, npm cache without lockfile, preflight false positive | `incidents/ci-path-guardrail-false-positive.md` |
| Deployment status race | deploy succeeded but receipt/status push failed, non-fast-forward, ref-lock | `incidents/deployment-status-push-race.md` |
| Deployment safety | rsync --delete risks deleting persistent data | `incidents/rsync-persistent-data-protection.md` |
| AI backends | API key exposed risk, private creator backend, server-side OpenAI key | `patterns/server-side-ai-credentials.md` |
| Secret availability | need to know whether API/admin secret exists without exposing it | `workflows/runtime-secret-presence-probe.md` |
| Creator publishing | private notes/images/prompts, AI draft, approval, publish, public search | `workflows/private-creator-to-public-pipeline.md` |
| Background jobs | upload keeps processing after page closes, cron, queue, progress ticker, per-job review | `workflows/persistent-background-processing.md` |
| Cross-site state | discoveries affect other sites, persistent flags, CORS, world bus, local fallback | `workflows/shared-cross-site-state.md` |
| Live portfolio | weekly GPT work, GitHub telemetry, activity.json, real status vs fictional UI | `workflows/live-project-feed-from-git.md` |

## Cross-project search keywords

`blank page`, `broken preview`, `aspect ratio`, `hotspot`, `SVG coordinates`, `rendered background`, `Playwright`, `Vite`, `PHP dist`, `Bluehost`, `cPanel`, `document root`, `addon domain`, `rsync delete`, `OpenAI API key`, `staging`, `browser validation`, `screenshots`, `health endpoint`, `smoke test`, `deployment receipt`, `non-fast-forward`, `ref lock`, `path guardrail`, `README flagged`, `npm lockfile`, `private publish`, `background queue`, `cron`, `world bus`, `activity.json`, `GitHub telemetry`, `.htaccess`, `custom 404`, `managed block`, `host-wide config`