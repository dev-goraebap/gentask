#!/usr/bin/env bash
# 프론트엔드 배포. 릴리스 디렉터리를 새로 올린 뒤 current 링크를 교체한다.
# 절차의 서술: docs/architecture/07-deployment-view.md
set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/lib/guard.sh"

SKIP_CHECK="${SKIP_CHECK:-0}"

echo "판정"
guard_branch
guard_clean_tree
guard_synced
guard_deploy_env
if [ "$SKIP_CHECK" = "1" ]; then
  step "web 검증 건너뜀 (SKIP_CHECK=1)"
else
  guard_web_check
fi

SHA="$(deployed_sha)"
REL="$(date +%Y%m%d%H%M%S)"
TARGET="$(ssh_target)"
DIST="$REPO_ROOT/clients/apps/web/dist/web/browser"

[ -d "$DIST" ] || fail "$DIST 가 없습니다"
[ -f "$DIST/index.csr.html" ] || fail "$DIST/index.csr.html 이 없습니다 (nginx 폴백 대상)"

echo "운반 릴리스 $REL"
echo "$SHA" >"$DIST/RELEASE_SHA"
ssh -p "$DEPLOY_PORT" "$TARGET" "mkdir -p ~/$WEB_ROOT/releases/$REL"
scp -P "$DEPLOY_PORT" -r "$DIST/." "$TARGET:$WEB_ROOT/releases/$REL/"

echo "링크 교체"
ssh -p "$DEPLOY_PORT" "$TARGET" "cd ~/$WEB_ROOT && ln -sfn releases/$REL current"

echo "완료 $REL (${SHA:0:7})"
