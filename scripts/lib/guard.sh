#!/usr/bin/env bash
# 배포 전 판정. 하나라도 어긋나면 호출한 스크립트를 중단시킨다.
# 근거: docs/architecture/decisions/0002-shared-contributing.md

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_ENV="$REPO_ROOT/.deploy.env"
REQUIRED_VARS=(DEPLOY_USER DEPLOY_HOST DEPLOY_PORT WEB_ROOT APP_DIR)

fail() {
  echo "중단: $1" >&2
  exit 1
}

step() {
  echo "  $1"
}

# 현재 브랜치가 main 인가
guard_branch() {
  local branch
  branch="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
  [ "$branch" = "main" ] || fail "브랜치가 main 이 아닙니다 (현재: $branch)"
  step "브랜치 main"
}

# 작업 트리에 커밋되지 않은 변경이 없는가
guard_clean_tree() {
  if [ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]; then
    git -C "$REPO_ROOT" status --short >&2
    fail "커밋되지 않은 변경이 있습니다"
  fi
  step "작업 트리 청결"
}

# 로컬 main 이 origin/main 과 같은 커밋인가
guard_synced() {
  git -C "$REPO_ROOT" fetch --quiet origin main || fail "origin 을 가져오지 못했습니다"
  local local_sha remote_sha
  local_sha="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  remote_sha="$(git -C "$REPO_ROOT" rev-parse origin/main)"
  [ "$local_sha" = "$remote_sha" ] || fail "로컬 main 과 origin/main 이 다릅니다 (push 또는 pull 이 필요합니다)"
  step "원격 동기 ${local_sha:0:7}"
}

# 배포 설정 파일이 존재하고 필수 변수가 채워져 있는가
guard_deploy_env() {
  [ -f "$DEPLOY_ENV" ] || fail "$DEPLOY_ENV 가 없습니다"
  # shellcheck disable=SC1090
  set -a && . "$DEPLOY_ENV" && set +a
  local missing=()
  local name
  for name in "${REQUIRED_VARS[@]}"; do
    [ -n "${!name:-}" ] || missing+=("$name")
  done
  [ ${#missing[@]} -eq 0 ] || fail "deploy.env 에 값이 없습니다: ${missing[*]}"
  step "배포 설정 확인"
}

# 두 축의 검증 명령이 통과하는가
guard_web_check() {
  (cd "$REPO_ROOT/clients/apps/web" && npm run check) || fail "web 검증 실패"
  step "web 검증 통과"
}

guard_api_check() {
  (cd "$REPO_ROOT/server" && ./gradlew build) || fail "server 검증 실패"
  step "server 검증 통과"
}

# 배포 대상 커밋. 릴리스 디렉터리에 남겨 되짚을 수 있게 한다.
deployed_sha() {
  git -C "$REPO_ROOT" rev-parse HEAD
}

ssh_target() {
  echo "$DEPLOY_USER@$DEPLOY_HOST"
}
