#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_KEY:?DEPLOY_KEY is required}"
: "${REMOTE_TARGET:?REMOTE_TARGET is required}"
: "${REMOTE_BACKUP_DIR:?REMOTE_BACKUP_DIR is required}"
: "${BACKUP_ID:?BACKUP_ID is required}"

port="${DEPLOY_PORT:-22}"
install -m 700 -d "$HOME/.ssh"
printf '%s\n' "$DEPLOY_KEY" > "$HOME/.ssh/deploy_platform_key"
chmod 600 "$HOME/.ssh/deploy_platform_key"
ssh-keyscan -p "$port" -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts"
remote="$DEPLOY_USER@$DEPLOY_HOST"
archive="$REMOTE_BACKUP_DIR/$BACKUP_ID.tar.gz"
parent="$(dirname "$REMOTE_TARGET")"
name="$(basename "$REMOTE_TARGET")"

ssh -i "$HOME/.ssh/deploy_platform_key" -p "$port" "$remote" \
  "set -e; test -s '$archive'; rm -rf '$REMOTE_TARGET.rollback-tmp'; mkdir -p '$REMOTE_TARGET.rollback-tmp'; tar -xzf '$archive' -C '$REMOTE_TARGET.rollback-tmp'; test -d '$REMOTE_TARGET.rollback-tmp/$name'; rm -rf '$REMOTE_TARGET'; mv '$REMOTE_TARGET.rollback-tmp/$name' '$REMOTE_TARGET'; rmdir '$REMOTE_TARGET.rollback-tmp' || true"

echo "Restored $REMOTE_TARGET from $archive"
