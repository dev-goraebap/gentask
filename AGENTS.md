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

## 에이전트 스킬

스킬 원본은 `.agents/skills/` 에 있습니다. 스킬을 고칠 때는 항상 이 원본을 고칩니다.

| 도구 | 설치 필요 여부 |
| :--- | :--- |
| **코덱스** | 해당 폴더를 직접 참조하므로 별도 설치가 필요하지 않습니다 |
| **Claude Code** | `.claude/skills/` 만 참조합니다. 이 저장소에서 세션을 시작하면 시작 훅(`.claude/settings.json`)이 사본을 만들므로 별도 작업이 필요하지 않습니다 |

훅이 동작하지 않은 경우, 즉 상위 경로에서 세션을 시작했거나 훅이 실패한 경우에는 아래를 실행합니다. 재실행해도 안전합니다.

```bash
npx --yes skills@latest add ./.agents/skills --skill '*' -a claude-code -y
```

추적 정책은 다음과 같습니다. `.agents/skills/` 는 기본적으로 미추적이며 팀 공용 스킬만 `.gitignore` 예외 목록에 등록해 커밋합니다. 개인 스킬은 같은 폴더에 두면 미추적 상태로 위 설치 절차가 그대로 적용됩니다. `.claude/skills/` 의 사본과 `skills-lock.json` 은 다음 설치 때 덮어써지는 생성물이므로 커밋하지 않습니다.

## 현재 상태

참조 문서 19건은 본문까지 작성되어 있습니다. 도입 순서와 각 문서의 자리는 [아키텍처 진입점](web/docs/architecture/index.md)에 있습니다.

`web/` 은 Angular 22 + Tailwind CSS 4 위에 Spartan(brain + helm)과 FSD 를 얹은 상태이며, Steiger 와 ESLint 가 배치 규칙을 빌드에서 강제합니다. 화면은 할일 목록과 상세 둘이 목 데이터 위에 서 있습니다.

진행 중인 기능은 [할일 해내기](specs/할일-해내기/requirements.md)이며 상태는 Draft 입니다. 요구사항 1·2 가 화면으로 구현되었고, 3 은 마감일이 남았으며 4·5 는 미착수입니다. 상세를 목록 곁의 패널로 바꾸기로 한 결정이 문서에 들어가 있고 코드는 아직 별도 페이지입니다.

[할일 관점별로 보기](specs/할일-관점별로-보기/requirements.md)는 Draft 로 열어 둔 상태이며 착수 전입니다. 계획된 일정 관점이 마감일에 의존하므로 할일 해내기의 요구사항 3 이 선행합니다.
