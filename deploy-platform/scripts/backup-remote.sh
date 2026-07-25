#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_KEY:?DEPLOY_KEY is required}"
: "${REMOTE_SOURCE:?REMOTE_SOURCE is required}"
: "${REMOTE_BACKUP_DIR:?REMOTE_BACKUP_DIR is required}"
: "${BACKUP_ID:?BACKUP_ID is required}"

port="${DEPLOY_PORT:-22}"
install -m 700 -d "$HOME/.ssh"
printf '%s\n' "$DEPLOY_KEY" > "$HOME/.ssh/deploy_platform_key"
chmod 600 "$HOME/.ssh/deploy_platform_key"
ssh-keyscan -p "$port" -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts"

remote="$DEPLOY_USER@$DEPLOY_HOST"
ssh -i "$HOME/.ssh/deploy_platform_key" -p "$port" "$remote" \
  "set -e; mkdir -p '$REMOTE_BACKUP_DIR'; test -d '$REMOTE_SOURCE'; tar -C \"$(dirname "$REMOTE_SOURCE")\" -czf '$REMOTE_BACKUP_DIR/$BACKUP_ID.tar.gz' \"$(basename "$REMOTE_SOURCE")\"; test -s '$REMOTE_BACKUP_DIR/$BACKUP_ID.tar.gz'"

echo "Backup created: $REMOTE_BACKUP_DIR/$BACKUP_ID.tar.gz"
