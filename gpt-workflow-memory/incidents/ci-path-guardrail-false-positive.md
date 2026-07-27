# Incident: Deployment path guardrail falsely blocks a safe change

## Symptoms
- CI scans repository text for forbidden production paths.
- Source/config checks pass, but the job fails because documentation mentions a forbidden path while explaining that it is out of scope.
- Another common setup failure: dependency caching is enabled even though the project has no lockfile.

## Root causes
1. Guardrail search included Markdown/documentation instead of only executable/configuration sources.
2. CI cache configuration assumed a lockfile that did not exist.

## Proven solution
- Keep path-guardrail scans focused on workflow files, scripts, deployment config, and executable source that can actually alter deployment behavior.
- Exclude explanatory Markdown from forbidden-path grep checks.
- Do not enable npm dependency caching unless the expected lockfile exists.
- Validate shell workflow blocks with `bash -n` and run `git diff --check`.
- Confirm staging-path detection still succeeds after narrowing the scan.

## Search keywords
`false positive forbidden path`, `README flagged`, `npm cache lockfile`, `path guardrail`, `preflight failed`

## Source history
Derived from the workflow-v2 preflight failures documented in PR #34.