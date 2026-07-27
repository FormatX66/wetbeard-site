# Incident: Bluehost Document Root Unknown

## Symptoms
- Deployment could not safely target a standalone domain because its cPanel document root was unknown.
- Guessing `public_html/<domain>` risked publishing into the wrong directory.
- A cPanel probe could fail silently or return no root for aliases/unregistered domains.

## Working approach
1. Do not guess document roots.
2. Reuse existing Bluehost SSH credentials from GitHub Actions when available.
3. Query cPanel/UAPI from the server for domain metadata.
4. Make diagnostic workflows self-reporting: always record sanitized results even when a command fails.
5. Distinguish addon domains, aliases/parked domains, and domains not registered in the cPanel account.
6. Unlock deployment only for positively verified roots.

## Known examples from the website project
- ArkmatX root was verified as `public_html/arkmatx`.
- Xander root was verified as `public_html/xanderzombie`.
- Witchdix initially was not represented as a cPanel domain, so its standalone-domain mapping could not be safely inferred.

## Verification
- cPanel reports the domain/root pairing.
- Deploy a staging build.
- Verify the public HTTP URL returns the intended build.

## Keywords
Bluehost, cPanel, UAPI, addon domain, alias domain, document root, SSH, public_html, domain mapping
