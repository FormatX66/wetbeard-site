# Domain Root and Addon-Domain Recovery

## Use when
A site is built but the target domain/document root is unknown, missing, or Bluehost/cPanel rejects addon-domain creation.

## Proven pattern
1. Query cPanel/host metadata before guessing paths.
2. Record only sanitized home-relative document-root candidates/status.
3. Make diagnostics self-reporting: commit a result even when the API call fails.
4. If the domain exists, verify its actual root before deployment.
5. If the domain is absent, determine whether it is an addon domain, alias/parked domain, or otherwise unmanaged in the account.
6. For cPanel addon-domain creation, include the account user and use a fully-qualified generated subdomain under the account's actual primary domain when required.
7. Re-query cPanel after creation; never assume the command succeeded.
8. If standalone-domain creation is blocked externally, deploy a safe fallback review path under an already verified host so development/review can continue without corrupting DNS/Apache state.

## Do not
- manually edit cPanel userdata/Apache files as a first workaround
- invent document roots
- unlock production deploys from placeholder config

## Source history
Derived from PRs #46, #47, #48, #50, #52, and #53.