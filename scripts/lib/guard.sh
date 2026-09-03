#!/usr/bin/env bash
# 배포 전 판정. 하나라도 어긋나면 호출한 스크립트를 중단시킨다.
# 근거: docs/architecture/decisions/0002-shared-contributing.md

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REQUIRED_VARS=(DEPLOY_USER DEPLOY_HOST DEPLOY_PORT WEB_ROOT APP_DIR)

fail() {
  echo "중단: $1" >&2
  exit 1
}

step() {
  echo "  $1"
}

usage() {
  cat >&2 <<'EOF'
사용법: <스크립트> <qa|prod> <태그>

  qa   는 rc 태그만 받는다   (예: v0.2.0-rc.1)
  prod 는 정식 태그만 받는다 (예: v0.2.0)

배포할 태그를 먼저 체크아웃한다.

  git fetch --tags
  git switch --detach v0.2.0-rc.1
  bash scripts/deploy.sh qa v0.2.0-rc.1
EOF
  exit 1
}

# 인자를 읽어 대상과 태그를 정한다. 대상마다 설정 파일이 다르다.
guard_args() {
  [ $# -eq 2 ] || usage
  DEPLOY_TARGET="$1"
  DEPLOY_TAG="$2"
  case "$DEPLOY_TARGET" in
  qa | prod) ;;
  *) fail "대상은 qa 또는 prod 입니다 (받은 값: $DEPLOY_TARGET)" ;;
  esac
  DEPLOY_ENV="$REPO_ROOT/.deploy.$DEPLOY_TARGET.env"
  step "대상 $DEPLOY_TARGET"
}

# 태그가 존재하고 대상에 맞는 형식인가
guard_tag() {
  git -C "$REPO_ROOT" fetch --quiet --tags origin || fail "origin 의 태그를 가져오지 못했습니다"
  git -C "$REPO_ROOT" rev-parse --verify --quiet "$DEPLOY_TAG^{tag}" >/dev/null ||
    fail "주석 태그 $DEPLOY_TAG 가 없습니다 (git tag -a 로 만듭니다)"

  case "$DEPLOY_TARGET" in
  qa)
    [[ "$DEPLOY_TAG" == *-rc.* ]] ||
      fail "qa 는 rc 태그만 받습니다 (예: v0.2.0-rc.1)"
    ;;
  prod)
    [[ "$DEPLOY_TAG" != *-rc.* ]] ||
      fail "운영에 rc 태그를 배포하지 않습니다. QA 를 통과한 뒤 같은 커밋에 정식 태그를 붙입니다"
    ;;
  esac
  step "태그 $DEPLOY_TAG"
}

# 작업 트리가 그 태그의 커밋에 놓여 있는가
#
# 스크립트가 체크아웃을 대신하지 않는다. 작업 중인 변경을 말없이 밀어낼 수 있기 때문이다.
guard_at_tag() {
  local head_sha tag_sha
  head_sha="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  tag_sha="$(git -C "$REPO_ROOT" rev-parse "$DEPLOY_TAG^{commit}")"
  [ "$head_sha" = "$tag_sha" ] ||
    fail "작업 트리가 $DEPLOY_TAG 가 아닙니다. git switch --detach $DEPLOY_TAG 로 옮깁니다"
  step "체크아웃 ${tag_sha:0:7}"
}

# 작업 트리에 커밋되지 않은 변경이 없는가
guard_clean_tree() {
  if [ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]; then
    git -C "$REPO_ROOT" status --short >&2
    fail "커밋되지 않은 변경이 있습니다"
  fi
  step "작업 트리 청결"
}

# 배포할 커밋이 origin/main 에 들어 있는가
#
# 브랜치 이름으로 판정하지 않는다. 태그를 체크아웃하면 detached HEAD 가 되기 때문이다.
# 조상 판정은 그 커밋이 검토를 거쳐 main 에 병합되었음을 보장한다.
guard_released() {
  git -C "$REPO_ROOT" fetch --quiet origin main || fail "origin 을 가져오지 못했습니다"
  git -C "$REPO_ROOT" merge-base --is-ancestor "$DEPLOY_TAG^{commit}" origin/main ||
    fail "$DEPLOY_TAG 가 origin/main 에 없습니다. 병합하고 push 한 뒤 배포합니다"
  step "origin/main 에 포함됨"
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
  [ ${#missing[@]} -eq 0 ] || fail "$(basename "$DEPLOY_ENV") 에 값이 없습니다: ${missing[*]}"
  step "배포 설정 확인 $(basename "$DEPLOY_ENV")"
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
  git -C "$REPO_ROOT" rev-parse "$DEPLOY_TAG^{commit}"
}

ssh_target() {
  echo "$DEPLOY_USER@$DEPLOY_HOST"
}
