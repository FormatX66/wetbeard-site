#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_KEY:?DEPLOY_KEY is required}"
: "${DEPLOY_TARGET:?DEPLOY_TARGET is required}"
: "${DEPLOY_SOURCE:?DEPLOY_SOURCE is required}"
: "${RELEASE_ID:?RELEASE_ID is required}"

port="${DEPLOY_PORT:-22}"
release_root="public_html/dev-platform/releases"
site_name="$(basename "$DEPLOY_TARGET")"
release_dir="$release_root/$site_name/$RELEASE_ID"
previous="${DEPLOY_TARGET}.v2-prev"
next="${DEPLOY_TARGET}.v2-next"

install -m 700 -d "$HOME/.ssh"
printf '%s\n' "$DEPLOY_KEY" > "$HOME/.ssh/deploy_platform_key"
chmod 600 "$HOME/.ssh/deploy_platform_key"
ssh-keyscan -p "$port" -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts"
remote="$DEPLOY_USER@$DEPLOY_HOST"

# Upload the release completely outside production first.
ssh -i "$HOME/.ssh/deploy_platform_key" -p "$port" "$remote" "set -e; rm -rf '$release_dir'; mkdir -p '$release_dir'"
tar -C "$DEPLOY_SOURCE" -czf - . | ssh -i "$HOME/.ssh/deploy_platform_key" -p "$port" "$remote" "tar -xzf - -C '$release_dir'"

# Copy to a sibling and swap with rollback-on-error semantics.
ssh -i "$HOME/.ssh/deploy_platform_key" -p "$port" "$remote" "set -e;
  test -s '$release_dir/index.html';
  rm -rf '$next' '$previous';
  cp -a '$release_dir' '$next';
  test -s '$next/index.html';
  if [ -d '$DEPLOY_TARGET' ]; then mv '$DEPLOY_TARGET' '$previous'; fi;
  if mv '$next' '$DEPLOY_TARGET'; then
    :;
  else
    rm -rf '$next';
    if [ -d '$previous' ]; then mv '$previous' '$DEPLOY_TARGET'; fi;
    exit 1;
  fi"

echo "Promoted release $RELEASE_ID to $DEPLOY_TARGET; previous tree retained at $previous until verification"
