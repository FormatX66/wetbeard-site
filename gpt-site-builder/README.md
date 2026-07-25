# GPT Website Builder

This is a completely isolated website-building/deployment system. It does not deploy to existing production sites.

## Normal phone workflow

1. Describe a website or change in ChatGPT.
2. GPT creates/edits `builder-sites/<site-id>/` and its site spec.
3. GPT updates `gpt-site-builder/request.json`.
4. GitHub Actions validates, backs up the preview, deploys atomically, verifies the public URL, and records a receipt.
5. Review the preview in Safari and give GPT corrections.
6. Repeat until approved.

## Isolation contract

All builder previews must live below:

`public_html/gpt-builder-preview/<site-id>`

All builder releases/backups must live below:

`public_html/gpt-builder-system/`

The builder refuses `uber`, `wetbeard`, `dev-platform`, and bare `public_html` targets.

There is intentionally no production-promotion workflow in this isolated builder. A finished site can later receive an explicit production manifest after review.

## Hosts

Host profiles live in `gpt-site-builder/hosts/`. Bluehost is wired to the existing SSH secrets. OCDsoft is represented as a separate adapter and can be enabled by adding its three GitHub secrets.

## Site specs

Site specifications live in `gpt-site-builder/specs/<site-id>.json`. Each site has its own source directory, public preview URL, host, health markers, and retention policy.
