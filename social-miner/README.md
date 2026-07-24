# Social Comment Miner

PHP application for collecting and compiling Facebook/Instagram comment evidence from supported Meta APIs **and** Meta account data exports. It preserves comment text and raw source records, groups commenters, flags possible threats/harassment, deduplicates recurring exports, and exports evidence to CSV.

## Ingestion paths

- Official Meta API sync for eligible professional/Page accounts.
- Manual Meta export ZIP or JSON upload from the private dashboard.
- iPhone Shortcuts upload using a rotatable bearer token.
- Scheduled Google Drive or Dropbox polling for recurring Meta exports.
- Protected server-side `storage/inbox/` processing for files placed on the host directly.

## Storage
Atomic JSON files protected by `flock()` are used so the app works on shared PHP hosting without requiring SQLite/MySQL extensions. Data lives under `storage/`, which is denied by Apache and retained across deploys.

## Security
- `config.local.php` is generated on the server by the deployment workflow and is not committed.
- Meta/cloud secrets are stored server-side and are never returned in full by the API.
- Admin actions require a session plus CSRF token.
- Shortcut uploads require a dedicated bearer token that can be rotated from the dashboard.
- `storage/` and local config files are denied by Apache.
- Meta webhooks require a valid `X-Hub-Signature-256` HMAC.

## Recurring exports
Meta can export account information to an external service on a recurring schedule. Configure Meta to use a dedicated Google Drive or Dropbox folder, then enter the corresponding OAuth refresh credentials and folder ID/path in the dashboard. The Bluehost cron worker checks for new ZIP/JSON files every 15 minutes and records each remote file revision after successful processing.

## Meta setup
Instagram API comment access requires a professional Instagram account and the relevant Meta permissions. Facebook API comments require a Page access token for a Page the app/user can manage. The export importer does not require a professional account because it processes files produced by Meta's own account-export feature.

## Endpoints
- `GET api.php?action=health`
- authenticated UI at `index.php`
- manual/Shortcut upload at `import.php`
- CLI scheduled worker at `cron-import.php`
- Meta webhook callback at `webhook.php`
