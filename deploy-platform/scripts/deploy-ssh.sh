#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_KEY:?DEPLOY_KEY is required}"
: "${DEPLOY_TARGET:?DEPLOY_TARGET is required}"
: "${DEPLOY_SOURCE:?DEPLOY_SOURCE is required}"

port="${DEPLOY_PORT:-22}"

install -m 700 -d "$HOME/.ssh"
printf '%s\n' "$DEPLOY_KEY" > "$HOME/.ssh/deploy_platform_key"
chmod 600 "$HOME/.ssh/deploy_platform_key"
ssh-keyscan -p "$port" -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts"

ssh -i "$HOME/.ssh/deploy_platform_key" -p "$port" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$DEPLOY_TARGET'"
tar -C "$DEPLOY_SOURCE" -czf - . | ssh -i "$HOME/.ssh/deploy_platform_key" -p "$port" "$DEPLOY_USER@$DEPLOY_HOST" "tar -xzf - -C '$DEPLOY_TARGET'"

echo "Deployed $DEPLOY_SOURCE to $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_TARGET"
