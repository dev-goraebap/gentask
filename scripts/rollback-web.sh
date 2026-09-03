#!/usr/bin/env bash
# 프론트엔드 롤백. current 링크를 이전 릴리스로 되돌린다. nginx 재시작은 필요하지 않다.
#
#   bash scripts/rollback-web.sh prod            릴리스 목록만 본다
#   bash scripts/rollback-web.sh prod v0.1.0     그 릴리스로 되돌린다
set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/lib/guard.sh"

[ $# -ge 1 ] || fail "사용법: $(basename "$0") <qa|prod> [릴리스이름]"

DEPLOY_TARGET="$1"
case "$DEPLOY_TARGET" in
qa | prod) ;;
*) fail "대상은 qa 또는 prod 입니다 (받은 값: $DEPLOY_TARGET)" ;;
esac
DEPLOY_ENV="$REPO_ROOT/.deploy.$DEPLOY_TARGET.env"

guard_deploy_env
TARGET="$(ssh_target)"

if [ $# -eq 1 ]; then
  echo "$DEPLOY_TARGET 의 릴리스 목록 (현재 링크는 -> 로 표시)"
  ssh -p "$DEPLOY_PORT" "$TARGET" "cd ~/$WEB_ROOT && ls -1 releases && echo '---' && ls -l current"
  echo
  echo "사용법: $(basename "$0") $DEPLOY_TARGET <릴리스이름>"
  exit 0
fi

REL="$2"
ssh -p "$DEPLOY_PORT" "$TARGET" "test -d ~/$WEB_ROOT/releases/$REL" || fail "릴리스 $REL 이 서버에 없습니다"
ssh -p "$DEPLOY_PORT" "$TARGET" "cd ~/$WEB_ROOT && ln -sfn releases/$REL current"

echo "완료 $REL → $DEPLOY_TARGET"
