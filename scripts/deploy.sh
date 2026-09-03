#!/usr/bin/env bash
# 두 축을 함께 배포한다. 한쪽만 올리려면 deploy-web.sh · deploy-api.sh 를 직접 부른다.
#
#   bash scripts/deploy.sh qa   v0.2.0-rc.1
#   bash scripts/deploy.sh prod v0.2.0
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$HERE/deploy-api.sh" "$@"
"$HERE/deploy-web.sh" "$@"
