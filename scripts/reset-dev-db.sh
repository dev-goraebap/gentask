#!/usr/bin/env bash
# 개발용 데이터베이스를 지우고 다시 만든다.
#
# 브랜치를 옮겨 마이그레이션 구성이 달라지면 Flyway 체크섬이 어긋나 애플리케이션이
# 기동하지 않는다. 그때 이 명령으로 복구한다.
#
#   bash scripts/reset-dev-db.sh          데이터베이스만 다시 만든다
#   bash scripts/reset-dev-db.sh --all    보관소(MinIO)까지 함께 비운다
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_DIR="$REPO_ROOT/server"
DB_CONTAINER=gentask-dev-postgres
MINIO_VOLUME=server_minio-data
ALL=0

[ "${1:-}" = "--all" ] && ALL=1

fail() {
  echo "중단: $1" >&2
  exit 1
}

command -v docker >/dev/null || fail "docker 가 없습니다"
docker info >/dev/null 2>&1 || fail "Docker 데몬이 실행 중이 아닙니다"

echo "컨테이너 정지"
(cd "$COMPOSE_DIR" && docker compose down)

echo "데이터 볼륨 삭제"
docker volume rm -f server_postgres-data >/dev/null 2>&1 || true
if [ "$ALL" = "1" ]; then
  docker volume rm -f "$MINIO_VOLUME" >/dev/null 2>&1 || true
  echo "  보관소도 비웠습니다"
fi

echo "컨테이너 기동"
(cd "$COMPOSE_DIR" && docker compose up -d)

echo "데이터베이스 준비 대기"
for _ in $(seq 1 40); do
  if docker exec "$DB_CONTAINER" pg_isready -U gentask -d gentask >/dev/null 2>&1; then
    echo "완료. ./gradlew bootRun 이 마이그레이션을 적용합니다"
    exit 0
  fi
  sleep 1
done

fail "데이터베이스가 준비되지 않았습니다. docker compose logs postgres 를 확인합니다"
