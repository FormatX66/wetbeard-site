# Live Health Endpoint and Smoke-Test Workflow

## Use when
A web application has dynamic/server-side behavior that a simple HTTP 200 on the homepage cannot prove.

## Proven pattern
1. Run syntax/static checks before deployment (for example PHP syntax, JS syntax, JSON parsing).
2. Run focused smoke tests for the important data path before touching production.
3. Deploy the candidate build.
4. Call a live health endpoint that checks the runtime environment, not just the web server.
5. Include writable-storage/database/runtime checks where applicable.
6. Verify at least one protected or functional route when authentication is part of the app.
7. Record deployment success only after the live functional check passes.

## Examples
- PHP syntax + queue/review smoke test + protected review-route verification.
- writable storage health check before writing a deployment receipt.
- bot/report parser smoke tests before Bluehost deployment.

## Search keywords
`homepage 200 but app broken`, `health endpoint`, `writable storage`, `smoke test`, `protected route`, `PHP syntax`

## Source history
Derived from Social Miner deployment work in PRs #27, #29, and #32.