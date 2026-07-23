# Social Comment Miner

Dependency-free PHP application for collecting comments through Meta's supported Facebook/Instagram APIs, preserving comment text, grouping commenters, flagging possible threats/harassment, and exporting evidence to CSV.

## Storage
Atomic JSON files protected by `flock()` are used so the app works on shared PHP hosting without requiring SQLite/MySQL extensions. Data lives under `storage/`, which is denied by Apache and retained across deploys.

## Security
- `config.local.php` is generated on the server by the deployment workflow and is not committed.
- Meta tokens are stored server-side and are never returned in full by the API.
- Admin actions require a session plus CSRF token.
- `storage/` and local config files are denied by Apache.

## Meta setup
Instagram comment access requires a professional Instagram account and the relevant Meta permissions. Facebook comments require a Page access token for a Page the app/user can manage. API version and Instagram host are configurable in the UI.

## Endpoints
- `GET api.php?action=health`
- authenticated UI at `index.php`
- Meta webhook callback at `webhook.php`
