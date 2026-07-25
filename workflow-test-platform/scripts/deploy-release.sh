#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?}"
: "${DEPLOY_USER:?}"
: "${DEPLOY_KEY:?}"
: "${SOURCE_DIR:?}"
: "${TARGET_PATH:?}"
: "${RELEASE_ROOT:?}"
: "${BACKUP_ROOT:?}"
: "${RELEASE_ID:?}"

case "$TARGET_PATH" in
  public_html/workflow-test-lab) ;;
  *) echo "REFUSED target: $TARGET_PATH" >&2; exit 1;;
esac
case "$RELEASE_ROOT" in public_html/workflow-test-lab-releases) ;; *) exit 1;; esac
case "$BACKUP_ROOT" in public_html/workflow-test-lab-backups) ;; *) exit 1;; esac

port="${DEPLOY_PORT:-22}"
install -m 700 -d "$HOME/.ssh"
printf '%s\n' "$DEPLOY_KEY" > "$HOME/.ssh/workflow_test_key"
chmod 600 "$HOME/.ssh/workflow_test_key"
ssh-keyscan -p "$port" -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
remote="$DEPLOY_USER@$DEPLOY_HOST"
ssh_cmd=(ssh -i "$HOME/.ssh/workflow_test_key" -p "$port" -o BatchMode=yes -o ConnectTimeout=15 "$remote")

release="$RELEASE_ROOT/$RELEASE_ID"
backup="$BACKUP_ROOT/backup-$RELEASE_ID.tar.gz"
next="${TARGET_PATH}.next"
previous="${TARGET_PATH}.previous"

"${ssh_cmd[@]}" "set -e; mkdir -p '$RELEASE_ROOT' '$BACKUP_ROOT'; rm -rf '$release'; mkdir -p '$release'"
tar -C "$SOURCE_DIR" -czf - . | "${ssh_cmd[@]}" "tar -xzf - -C '$release'"

"${ssh_cmd[@]}" "set -e;
  test -s '$release/index.html';
  if [ -d '$TARGET_PATH' ]; then tar -C \"$(dirname "$TARGET_PATH")\" -czf '$backup' \"$(basename "$TARGET_PATH")\"; fi;
  rm -rf '$next' '$previous';
  cp -a '$release' '$next';
  test -s '$next/index.html';
  if [ -d '$TARGET_PATH' ]; then mv '$TARGET_PATH' '$previous'; fi;
  if mv '$next' '$TARGET_PATH'; then :; else
    rm -rf '$next';
    if [ -d '$previous' ]; then mv '$previous' '$TARGET_PATH'; fi;
    exit 1;
  fi"

echo "release=$release"
echo "backup=$backup"
