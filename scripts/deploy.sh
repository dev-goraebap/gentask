#!/usr/bin/env bash
# 두 축을 함께 배포한다. 한쪽만 올리려면 deploy-web.sh · deploy-api.sh 를 직접 부른다.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$HERE/deploy-api.sh"
"$HERE/deploy-web.sh"
