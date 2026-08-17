# refarch-angular-springboot

Angular 프론트엔드와 Spring Boot 백엔드를 함께 담는 모노레포입니다. 일반적인 요구사항을 갖는 웹 애플리케이션을 만들면서, 다른 프로젝트가 참고할 수 있는 **참조 아키텍처**를 축적하는 것이 목적입니다.

## 두 축

| 축 | 위치 | 성격 |
| :--- | :--- | :--- |
| **요구사항 축** | `docs/` | 프로젝트마다 새로 발견됩니다 |
| **참조 아키텍처** | `web/docs/` | 프로젝트를 넘나들며 축적됩니다 |

## 작업 규칙

- **개발 프로세스는 [docs/process.md](docs/process.md)를 따릅니다.** 요구사항 초안 → UI 프로토타입 → 확정 게이트 → 스펙 심화 → 구현 → 검증 게이트 순서이며, 각 단계의 산출물과 정지 조건이 그 문서에 있습니다.
- **프론트엔드 아키텍처 규칙은 [web/docs/architecture/index.md](web/docs/architecture/index.md)부터 진입합니다.** 현재 작업에 해당하는 참조 문서만 읽고 전부 싣지 않습니다.
- **시각 언어는 [web/docs/design/DESIGN.md](web/docs/design/DESIGN.md)가 소유합니다.** 아키텍처 문서는 토큰의 이름 집합과 하한을, 이 문서는 그 안을 채우는 값과 근거를 갖습니다.
- **규칙을 바꾸기 전에 [결정 기록](web/docs/architecture/decisions/index.md)을 먼저 확인합니다.** 대부분의 규칙에는 그것을 그렇게 정한 사유와 기각한 대안이 남아 있습니다.
- **갈림길 결정은 결정 기록으로 남깁니다.** 검토한 대안과 트레이드오프를 한 문단 이상 쓸 수 있으면 [템플릿](web/docs/templates/adr.template.md)으로 작성하고 목차에 등록합니다. 쓸 수 없으면 참조 문서 본문에 직접 적습니다.
- **문서 형식은 템플릿을 따릅니다.** 요구사항은 [docs/templates/requirements.template.md](docs/templates/requirements.template.md), 기능별 설계 편차는 [docs/templates/design.template.md](docs/templates/design.template.md)입니다.

## 전역 규칙

프로세스 문서에서 옮겨 오지 않고 그쪽을 원본으로 둡니다. 자주 걸리는 셋만 여기 적습니다.

- **문서 우선 변경**: 동작과 플로우가 바뀌면 requirements 를 먼저 고칩니다. 문구·색·간격 같은 표면 변경은 문서를 거치지 않습니다.
- **이층 번호 불변**: 스토리 번호는 초안 시점부터, 수용 기준 번호는 확정 시점부터 불변입니다. 삭제는 결번, 추가는 말번입니다.
- **문서는 판단, 강제는 훅**: 기계가 판정할 수 있는 것은 린터·테스트·빌드로 내려보냅니다. 문서에는 판단이 필요한 규약만 남기고, 강제되지 않는 규칙은 그 사실을 함께 적습니다.

## 현재 상태

`web/` 은 Angular 22 + Tailwind CSS 4 스캐폴드 상태입니다. 참조 문서 19건은 자리만 등록되어 있고 본문은 순차적으로 이식합니다. 도입 순서와 남은 목록은 [아키텍처 진입점](web/docs/architecture/index.md)에 있습니다.
