# Incident: Legacy Repository Overwrote a Canonical Production Site

## Symptoms
A production site suddenly reverted to obsolete or low-resolution assets even
though its current source and browser tests were healthy in the canonical
repository. Server file timestamps matched a successful workflow run from an
older repository.

## Root cause
Two repositories could deploy the same production document root. The legacy
workflow rebuilt stale source and used `rsync --delete`, so a technically
successful deployment replaced the canonical release and deleted server-only
or review directories. Its verification checked only the HTTP status code, so
the visual regression passed.

## Working solution
- Establish one repository as the production owner for each site.
- Remove the site from legacy automatic production matrices.
- Reject manual legacy production deployments for that site with a clear
  ownership message while leaving unrelated sites and staging workflows intact.
- Build an isolated preview from the canonical repository and verify it in a
  real browser before promotion.
- Promote with a dated backup and named-file merge that preserves runtime,
  certificate, service, preview, and unknown server-side paths.

## Verification
1. Confirm the legacy automatic production matrix no longer contains the site.
2. Confirm a manual legacy production request for the site exits before build
   or SSH configuration.
3. Confirm unrelated sites remain deployable.
4. Verify the canonical hosted preview at desktop and phone sizes, including
   important interactions and browser logs.
5. After an approved promotion, verify the live URL and protected neighboring
   services.

## Rollback and safety
Re-add the site to a legacy production workflow only after formally transferring
ownership and reconciling its source with the canonical repository. Do not rely
on exclusions alone when the entire legacy release is stale.

## Keywords
legacy repository, canonical repository, competing deployment, production
ownership, stale build, rsync delete, visual regression, HTTP-only verification
