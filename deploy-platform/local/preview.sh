#!/usr/bin/env bash
set -euo pipefail
SITE="${1:-ubercorp}"
PORT="${2:-8080}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MANIFEST="$ROOT/deploy-platform/sites/$SITE.json"
[ -f "$MANIFEST" ] || { echo "Unknown site: $SITE" >&2; exit 1; }
SOURCE="$(python3 - "$MANIFEST" "$ROOT" <<'PY'
import json,sys,os
m=json.load(open(sys.argv[1],encoding='utf-8'))
print(os.path.join(sys.argv[2],m['source_dir']))
PY
)"
[ -d "$SOURCE" ] || { echo "Site source not found: $SOURCE" >&2; exit 1; }
echo "Local preview: $SITE"
echo "Source: $SOURCE"
echo "URL: http://127.0.0.1:$PORT/"
cd "$SOURCE"
if command -v php >/dev/null 2>&1; then
  echo "Using PHP built-in server."
  exec php -S "127.0.0.1:$PORT"
fi
echo "PHP not found; static preview only." >&2
exec python3 -m http.server "$PORT" --bind 127.0.0.1
