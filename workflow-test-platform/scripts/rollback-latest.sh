#!/usr/bin/env bash
set -euo pipefail
: "${DEPLOY_HOST:?}"; : "${DEPLOY_USER:?}"; : "${DEPLOY_KEY:?}"; : "${TARGET_PATH:?}"; : "${BACKUP_ROOT:?}"
case "$TARGET_PATH" in public_html/workflow-test-lab) ;; *) echo 'REFUSED' >&2; exit 1;; esac
port="${DEPLOY_PORT:-22}"
install -m 700 -d "$HOME/.ssh"
printf '%s\n' "$DEPLOY_KEY" > "$HOME/.ssh/workflow_test_key"
chmod 600 "$HOME/.ssh/workflow_test_key"
ssh-keyscan -p "$port" -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
remote="$DEPLOY_USER@$DEPLOY_HOST"
ssh -i "$HOME/.ssh/workflow_test_key" -p "$port" -o BatchMode=yes "$remote" "set -e;
  latest=\$(ls -1t '$BACKUP_ROOT'/*.tar.gz 2>/dev/null | head -1);
  test -n \"\$latest\";
  tmp='${TARGET_PATH}.rollback';
  rm -rf \"\$tmp\";
  mkdir -p \"\$tmp\";
  tar -xzf \"\$latest\" -C \"\$tmp\";
  test -s \"\$tmp/workflow-test-lab/index.html\";
  rm -rf '${TARGET_PATH}.rollback-old';
  if [ -d '$TARGET_PATH' ]; then mv '$TARGET_PATH' '${TARGET_PATH}.rollback-old'; fi;
  mv \"\$tmp/workflow-test-lab\" '$TARGET_PATH';
  rm -rf \"\$tmp\" '${TARGET_PATH}.rollback-old';
  echo \"RESTORED=\$latest\""
