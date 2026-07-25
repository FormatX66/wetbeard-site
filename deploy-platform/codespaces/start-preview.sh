#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

python3 deploy-platform/local/check-site.py ubercorp

php -S 127.0.0.1:8081 -t "$ROOT" >/tmp/ubercorp-php.log 2>&1 &
PHP_PID=$!
trap 'kill "$PHP_PID" 2>/dev/null || true' EXIT INT TERM

printf '\nÜbercorp phone preview starting...\n'
printf 'Open the forwarded Vite port and browse to /uber/\n\n'

npm run dev:vite
