#!/usr/bin/env bash
set -euo pipefail
: "${DEPLOY_HOST:?}"; : "${DEPLOY_USER:?}"; : "${DEPLOY_KEY:?}"; : "${SOURCE_DIR:?}"; : "${TARGET_PATH:?}"; : "${RELEASE_ROOT:?}"; : "${BACKUP_ROOT:?}"; : "${RELEASE_ID:?}"
case "$TARGET_PATH" in public_html/gpt-builder-preview/*) ;; *) echo 'unsafe target'; exit 1;; esac
case "$RELEASE_ROOT" in public_html/gpt-builder-system/releases/*) ;; *) echo 'unsafe release root'; exit 1;; esac
case "$BACKUP_ROOT" in public_html/gpt-builder-system/backups/*) ;; *) echo 'unsafe backup root'; exit 1;; esac
case "$TARGET_PATH $RELEASE_ROOT $BACKUP_ROOT" in *uber*|*wetbeard*|*dev-platform*) echo 'protected production namespace referenced'; exit 1;; esac
port="${DEPLOY_PORT:-22}"; release="$RELEASE_ROOT/$RELEASE_ID"; next="${TARGET_PATH}.next"; previous="${TARGET_PATH}.previous"
install -m 700 -d "$HOME/.ssh"; printf '%s\n' "$DEPLOY_KEY" > "$HOME/.ssh/gpt_builder_key"; chmod 600 "$HOME/.ssh/gpt_builder_key"
ssh-keyscan -p "$port" -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
remote="$DEPLOY_USER@$DEPLOY_HOST"; sshcmd=(ssh -i "$HOME/.ssh/gpt_builder_key" -p "$port" -o BatchMode=yes "$remote")
"${sshcmd[@]}" "set -e; mkdir -p '$RELEASE_ROOT' '$BACKUP_ROOT'; if [ -d '$TARGET_PATH' ]; then tar -C \"\$(dirname '$TARGET_PATH')\" -czf '$BACKUP_ROOT/pre-$RELEASE_ID.tar.gz' \"\$(basename '$TARGET_PATH')\"; fi; rm -rf '$release'; mkdir -p '$release'"
tar -C "$SOURCE_DIR" -czf - . | "${sshcmd[@]}" "tar -xzf - -C '$release'"
"${sshcmd[@]}" "set -e; test -s '$release/index.html'; rm -rf '$next'; cp -a '$release' '$next'; rm -rf '$previous'; if [ -d '$TARGET_PATH' ]; then mv '$TARGET_PATH' '$previous'; fi; if mv '$next' '$TARGET_PATH'; then :; else if [ -d '$previous' ]; then mv '$previous' '$TARGET_PATH'; fi; exit 1; fi"
echo "deployed $RELEASE_ID -> $TARGET_PATH"
