# Production Promotion and Deployment Receipt

## Use when
A staged site is ready to become the live production site.

## Proven pattern
1. Confirm the production document root was verified from cPanel/host evidence.
2. Confirm staging/browser checks passed.
3. Build the exact commit intended for production.
4. Deploy while preserving runtime data and server-only configuration.
5. Verify the public production URL returns a successful HTTP response.
6. Where available, verify a health endpoint, writable storage, protected/admin routes, and required runtime files.
7. Only after live verification, write a small deployment receipt/status file back to GitHub.
8. The receipt should record commit/reference, timestamp/status, and public URL—not secrets.

## Failure rule
If deployment succeeds but live verification fails, do not record the deployment as successful.

## Source history
Derived from Morri production promotion, realm production workflows, and Social Miner self-verifying deployment.