# Incident: Deployment completed but status commit failed

## Symptoms
- Deployment and health checks succeeded.
- Final GitHub status/receipt commit failed with non-fast-forward or ref-lock errors.
- Another workflow/user advanced `main` between checkout and status push.
- GitHub reported the deployment workflow as failed even though the deployed site had already verified successfully.

## Root cause
The deployment job coupled two different outcomes: **the deployment** and **publication of bookkeeping evidence**. It then treated failure of the lower-value bookkeeping write as failure of the already-verified deployment. Matrix jobs also competed to mutate the same branch.

## Proven rule
1. Live deployment verification determines deployment success.
2. A receipt/status publication must never cause an already-verified deployment to become red.
3. Prefer immutable Actions artifacts plus the job summary for run receipts.
4. Make receipt publication `continue-on-error` when it is non-authoritative bookkeeping.
5. If repository-resident state is genuinely required by another system, publish it in one bounded aggregator job after deployment rather than from concurrent matrix jobs.
6. Never repeat the actual deployment just because evidence publication raced or failed.
7. Never force-push `main` to solve a bookkeeping race.

## Search keywords
`non-fast-forward`, `ref lock`, `deployment succeeded but workflow failed`, `status commit race`, `receipt push`, `matrix git push`

## Source history
Derived from the Übercorp deployment-status race investigated in PR #33 and reinforced by the July 27 verified-realm staging failures, where build, deploy, and verification passed but the final receipt step failed.
