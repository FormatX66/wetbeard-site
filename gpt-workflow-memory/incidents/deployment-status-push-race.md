# Incident: Deployment completed but status commit failed

## Symptoms
- Deployment and health checks succeeded.
- Final GitHub status/receipt commit failed with non-fast-forward or ref-lock errors.
- Another workflow/user advanced `main` between checkout and status push.

## Root cause
The deployment job treated the repository state captured at job start as if `main` would remain unchanged through the entire deployment.

## Proven solution
1. Do not force-push `main`.
2. Keep the deployment receipt isolated to a single known file.
3. After live verification, create a temporary worktree or refresh from the latest `origin/main`.
4. Apply only the receipt/status file change.
5. Retry the normal fast-forward push a small bounded number of times if `main` advances again.
6. Never repeat the actual production deployment just because the receipt push raced.

## Search keywords
`non-fast-forward`, `ref lock`, `deployment succeeded but workflow failed`, `status commit race`, `receipt push`

## Source history
Derived from the Übercorp deployment-status race investigated in PR #33.