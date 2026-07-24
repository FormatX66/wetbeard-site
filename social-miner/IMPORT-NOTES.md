# Meta export import notes

The export importer is intentionally heuristic because Meta can change folder names and JSON field layouts over time. It scans JSON records that look comment-related, preserves the original raw record, and stores source file/path metadata for review.

For recurring exports, use a dedicated cloud folder when possible. The cloud poller only processes `.zip` and `.json` files and records each remote file revision after successful import so the same recurring archive is not repeatedly ingested.

For iPhone Shortcuts, use the private dashboard's upload URL and bearer token. Rotate the token immediately if it is exposed.
