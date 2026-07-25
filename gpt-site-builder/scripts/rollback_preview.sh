#!/usr/bin/env bash
set -euo pipefail
: "${DEPLOY_HOST:?}"; : "${DEPLOY_USER:?}"; : "${DEPLOY_KEY:?}"; : "${TARGET_PATH:?}"; : "${BACKUP_ROOT:?}"
case "$TARGET_PATH" in public_html/gpt-builder-preview/*) ;; *) echo 'unsafe target'; exit 1;; esac
case "$BACKUP_ROOT" in public_html/gpt-builder-system/backups/*) ;; *) echo 'unsafe backup root'; exit 1;; esac
case "$TARGET_PATH $BACKUP_ROOT" in *uber*|*wetbeard*|*dev-platform*) echo 'protected production namespace referenced'; exit 1;; esac
port="${DEPLOY_PORT:-22}"; install -m 700 -d "$HOME/.ssh"; printf '%s\n' "$DEPLOY_KEY" > "$HOME/.ssh/gpt_builder_key"; chmod 600 "$HOME/.ssh/gpt_builder_key"
ssh-keyscan -p "$port" -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
remote="$DEPLOY_USER@$DEPLOY_HOST"; ssh -i "$HOME/.ssh/gpt_builder_key" -p "$port" -o BatchMode=yes "$remote" "set -e; backup=\$(ls -1t '$BACKUP_ROOT'/*.tar.gz 2>/dev/null | head -1); test -n \"\$backup\"; parent=\$(dirname '$TARGET_PATH'); name=\$(basename '$TARGET_PATH'); restore='${TARGET_PATH}.restore'; rm -rf \"\$restore\"; mkdir -p \"\$restore\"; tar -xzf \"\$backup\" -C \"\$restore\"; test -s \"\$restore/\$name/index.html\"; rm -rf '${TARGET_PATH}.rollback-old'; if [ -d '$TARGET_PATH' ]; then mv '$TARGET_PATH' '${TARGET_PATH}.rollback-old'; fi; mv \"\$restore/\$name\" '$TARGET_PATH'; rm -rf \"\$restore\" '${TARGET_PATH}.rollback-old'; echo restored \"\$backup\""
