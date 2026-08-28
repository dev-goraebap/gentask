#!/usr/bin/env bash
# 프론트엔드 롤백. current 링크를 이전 릴리스로 되돌린다. nginx 재시작은 필요하지 않다.
# 인자로 릴리스 이름을 주면 그 릴리스로, 주지 않으면 목록만 보여 준다.
set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/lib/guard.sh"

guard_deploy_env
TARGET="$(ssh_target)"

if [ $# -eq 0 ]; then
  echo "릴리스 목록 (현재 링크는 -> 로 표시)"
  ssh -p "$DEPLOY_PORT" "$TARGET" "cd ~/$WEB_ROOT && ls -1 releases && echo '---' && ls -l current"
  echo
  echo "사용법: $(basename "$0") <릴리스이름>"
  exit 0
fi

REL="$1"
ssh -p "$DEPLOY_PORT" "$TARGET" "test -d ~/$WEB_ROOT/releases/$REL" || fail "릴리스 $REL 이 서버에 없습니다"
ssh -p "$DEPLOY_PORT" "$TARGET" "cd ~/$WEB_ROOT && ln -sfn releases/$REL current"

echo "완료 $REL"
