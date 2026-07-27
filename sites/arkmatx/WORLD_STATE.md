# ArkmatX Persistent World Bus

ArkmatX now provides the shared state layer for the connected realms.

## Sources shown by ArkmatX
- `public/activity.json` — weekly GPT-assisted worklog.
- `public/github-status.json` — real repository/PR/commit telemetry refreshed by GitHub Actions.
- `public/world-state.php` — persistent symbolic puzzle/world state.

## State safety
The state API accepts only an explicit allow-list of symbolic flags and counters. It is not a user profile, analytics store, or personal-data system.

## Cross-realm sync
`public/world-state-client.js` merges persistent server flags into the existing `realm-passport` localStorage key and pushes newly discovered allow-listed flags back to ArkmatX. Morri loads the sync client directly and acts as the compatibility bridge for the existing Witchdix and Xander travel loops.

This allows existing puzzles to keep using the lightweight passport while discoveries can persist across browsers/sessions once the ArkmatX PHP endpoint is deployed.

## Deployment dependency
The PHP state service becomes live only after the verified `arkmatx.com` Bluehost document root is configured and deployed. Until then, all frontends degrade to the existing local passport behavior.