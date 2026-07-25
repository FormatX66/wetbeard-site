# Phone-only development workflow

This branch is designed to be developed and reviewed from a phone using GitHub Codespaces.

## Open the development box

1. Open the repository on GitHub from the phone.
2. Switch to branch `dev/ubercorp-workflow-v2`.
3. Choose **Code → Codespaces → Create codespace on dev/ubercorp-workflow-v2**.
4. Wait for the container setup to finish.

The container installs Node 22, PHP, GitHub CLI, Vite dependencies, and the deployment-platform tools automatically.

## Start the preview

In the Codespaces terminal run:

```bash
npm run dev
```

Codespaces forwards port `5173` privately and opens a preview. Browse to:

```text
/uber/
```

The Vite server handles the website files. Requests to `/uber/api` and `/uber/lab` are proxied to the local PHP server on port `8081`, so the preview can exercise PHP-backed parts without touching Bluehost.

## Fast correction loop

1. Edit files in the Codespace.
2. Save.
3. Refresh the private phone preview.
4. Repeat until correct.
5. Run `npm run check:ubercorp`.
6. Commit to `dev/ubercorp-workflow-v2`.
7. Deploy to the isolated staging directory only after the local preview is approved.

## Safety boundaries

- The existing `/uber/` production site is not a development target.
- Workflow v2 staging is restricted to `public_html/dev-platform/`.
- Codespaces preview ports are private.
- Production promotion will be a separate explicit action.
