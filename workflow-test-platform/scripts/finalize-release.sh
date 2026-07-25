#!/usr/bin/env bash
set -euo pipefail
: "${DEPLOY_HOST:?}"; : "${DEPLOY_USER:?}"; : "${DEPLOY_KEY:?}"; : "${TARGET_PATH:?}"; : "${RELEASE_ROOT:?}"; : "${BACKUP_ROOT:?}"
case "$TARGET_PATH" in public_html/workflow-test-lab) ;; *) exit 1;; esac
port="${DEPLOY_PORT:-22}"
install -m 700 -d "$HOME/.ssh"
printf '%s\n' "$DEPLOY_KEY" > "$HOME/.ssh/workflow_test_key"
chmod 600 "$HOME/.ssh/workflow_test_key"
ssh-keyscan -p "$port" -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
remote="$DEPLOY_USER@$DEPLOY_HOST"
ssh -i "$HOME/.ssh/workflow_test_key" -p "$port" -o BatchMode=yes "$remote" "set -e;
  rm -rf '${TARGET_PATH}.previous';
  ls -1dt '$RELEASE_ROOT'/* 2>/dev/null | tail -n +6 | xargs -r rm -rf;
  ls -1t '$BACKUP_ROOT'/*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f"
