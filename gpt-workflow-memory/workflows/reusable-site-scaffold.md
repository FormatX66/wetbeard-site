# Reusable Site Scaffold Workflow

## Use when
Creating a new website inside an existing multi-site repository.

## Proven pattern
1. Generate the site under an isolated `sites/<slug>/` directory.
2. Give the site its own package/build files and `site.config.json`.
3. Keep staging and production targets explicit and separate.
4. Do not modify unrelated existing sites while scaffolding.
5. Validate JavaScript syntax, JSON config, and path safety before deployment.
6. Build only the selected site and deploy only its `dist/` output plus required runtime files.

## Guardrails
- Reject deployment destinations outside `public_html/`.
- Reject paths containing `..`.
- Treat document-root values as untrusted until verified from the host.
- A scaffold is not considered complete merely because files were generated; it still needs a real production build and browser-level validation.

## Source history
Derived from the reusable website-builder work in PR #35 and later deployment hardening.