#!/usr/bin/env bash
# API 배포. 산출물과 Dockerfile 을 올린 뒤 이미지를 다시 빌드해 컨테이너를 교체한다.
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
  step "server 검증 건너뜀 (SKIP_CHECK=1)"
else
  guard_api_check
fi

SHA="$(deployed_sha)"
TARGET="$(ssh_target)"
JAR="$REPO_ROOT/server/build/libs/app.jar"

[ -f "$JAR" ] || fail "$JAR 가 없습니다"

echo "운반"
ssh -p "$DEPLOY_PORT" "$TARGET" "mkdir -p ~/$APP_DIR/api"
scp -P "$DEPLOY_PORT" "$JAR" "$REPO_ROOT/server/Dockerfile" "$TARGET:$APP_DIR/api/"
ssh -p "$DEPLOY_PORT" "$TARGET" "echo $SHA > ~/$APP_DIR/api/RELEASE_SHA"

echo "컨테이너 교체"
ssh -p "$DEPLOY_PORT" "$TARGET" "cd ~/$APP_DIR && sudo docker compose up -d --build"

echo "완료 (${SHA:0:7})"
