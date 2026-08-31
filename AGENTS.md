# gentask

Angular 프론트엔드와 Spring Boot 백엔드 모노레포의 참조 아키텍처 저장소입니다.

## 두 축

| 축 | 위치 | 성격 |
| :--- | :--- | :--- |
| **요구사항 축** | `docs/prd.md` · `docs/spec/` · `backlog/tasks/` | 프로젝트별 요구사항 |
| **참조 아키텍처** | `docs/architecture/` | 프로젝트 공통 참조 아키텍처 |

## 문서 탐색 순서

- **개발 프로세스**: [결정-0007](docs/architecture/decisions/0007-shared-software-process.md)을 따릅니다. 요구사항의 원본과 백로그, 구현과 검증, 추적의 규약이 여기 있습니다.
- **테스트**: [결정-0008](docs/architecture/decisions/0008-shared-testing.md)을 따릅니다. 어느 층에 무엇을 두고 무엇을 두지 않는가가 여기 있습니다.
- **아키텍처**: [docs/architecture/index.md](docs/architecture/index.md)부터 진입합니다. 횡단 관심사 문서는 `docs/architecture/concepts/`의 `<축>-<순번>-<주제>.md`를 확인합니다 (`frontend` · `backend` · `shared`).
- **코드 스타일**: 코드를 작성하기 전에 해당 축의 코드 스타일 가이드(`FE-STY-NNN` · `BE-STY-NNN`)를 확인합니다.
- **아키텍처 결정**: 규칙이나 설계를 변경하기 전에 [9. 아키텍처 결정](docs/architecture/09-architecture-decisions.md)을 확인합니다.
- **유스케이스 서술서**: [docs/spec/작성지침.md](docs/spec/작성지침.md)를 따릅니다.
- **백로그 항목**: Epic · Story · Task 가 `backlog/tasks/` 에 함께 있고 프런트매터의 `type` 이 유형을 가릅니다. 착수 전 후보는 `backlog/drafts/`, 오래 닫힌 항목은 `backlog/completed/` 에 있습니다.
- **문서 참조 범위**: 현재 작업에 필요한 문서만 읽고 전체 문서를 불필요하게 적재하지 않습니다.

## 전역 규칙

- **문서 우선 변경**: 동작과 흐름이 바뀌면 서술서를 먼저 수정합니다. 문구·색·간격 등의 표면 변경은 문서를 거치지 않습니다.
- **번호 불변**: 대체 흐름 번호, 인수 조건 번호, 결정 기록 번호, 스타일 규칙 번호는 부여 후 변경하지 않습니다. 삭제 시 결번 처리하고, 추가 시 마지막 번호를 부여합니다. 유스케이스 ID 는 예외이며 [결정-0007](docs/architecture/decisions/0007-shared-software-process.md)을 따릅니다.
- **판단과 강제의 분리**: 기계가 판정할 수 있는 규칙은 린터·테스트·빌드로 강제합니다. 문서에는 판단이 필요한 규약만 남기고, 강제되지 않는 규칙은 그 사실을 명시합니다.
- **설정값 단일 원본**: 버전·경로·임계값 등의 설정값은 설정 파일에만 작성하고 문서에 중복 작성하지 않습니다.
- **커밋 규약**: 제목은 `<유형>(<범위>): <한국어 현재형 평서문>` 입니다. 유형 목록과 범위, 백로그 항목 참조 방식은 [결정-0002](docs/architecture/decisions/0002-shared-contributing.md)를 따릅니다.
- **결정 기록**: 구조, 비기능 특성, 의존성, 인터페이스, 구축 기법에 영향을 주는 선택은 [템플릿](docs/architecture/decisions/0000-template.md)으로 작성해 목차에 등록하거나 참조 문서 본문에 기록합니다.

## 검증

| 축 | 명령 |
| :--- | :--- |
| 프론트엔드 | `cd clients && npm run check -w web` |
| 백엔드 | `cd server && ./gradlew build` |
| 에이전트 | `cd clients && npm run check -w gentask-mcp` |
| 추적 | `node scripts/trace-check.mjs` |

- 검증을 통과하지 않은 상태로 커밋하거나 병합하지 않습니다.
- 추적 검사는 인수 조건과 테스트 이름을 대조합니다. 없는 인수 조건을 가리키는 접두어는 실패이고, 테스트가 없는 인수 조건은 목록으로만 냅니다.
- 각 명령의 세부 검사 항목과 실패 조건은 각 축의 개발 환경 문서를 확인합니다.

## 에이전트 스킬

- 스킬 원본(`.agents/skills/`)을 직접 수정합니다.
- Claude Code 환경에서 동기화가 필요한 경우 아래 명령을 실행합니다.

```bash
npx --yes skills@latest add ./.agents/skills --skill '*' -a claude-code -y
```

- `.agents/skills/`는 팀 공용 스킬만 `.gitignore` 예외로 등록해 커밋합니다.
- `.claude/skills/` 사본과 `skills-lock.json`은 커밋하지 않습니다.

## 배포

- 배포 절차와 서버 구성은 [7. 배포 뷰](docs/architecture/07-deployment-view.md)를 따릅니다.
- 접속 대상과 서버 내 경로는 변수로 두고, 실제 값은 추적되지 않는 `.deploy.env`에 정의합니다.

## 백로그

- 항목은 [Backlog.md](https://github.com/MrLesk/Backlog.md) 가 다룹니다. 구조와 채번의 규약은 [결정-0007](docs/architecture/decisions/0007-shared-software-process.md)이 갖습니다.
- 상태, 소속, 인수 조건을 바꿀 때는 `backlog` CLI 를 씁니다. 프런트매터를 직접 고치면 항목 사이의 관계가 어긋납니다.
- 인수 조건은 `<!-- AC:BEGIN -->` 마커 안에만 둡니다. 추적 검사기가 그 자리만 읽습니다.
- 결번은 `backlog task edit <ID> --remove-ac` 로 만들지 않습니다. 그 명령이 뒤 번호를 당깁니다. 문장을 `(결번)` 으로 바꿉니다.
- 서술서가 아직 없는 후보는 Draft 로 둡니다. 착수 순서는 Draft 번호가 갖습니다 — `ordinal` 은 Draft 목록의 정렬에 쓰이지 않습니다.
- Epic 소속은 선택입니다. 사용자 가치를 직접 내지 않는 기술 작업은 최상위 Task 로 두고, 자식 하나뿐인 Epic 을 만들지 않습니다.

```bash
backlog task list --plain          # 목록
backlog task view <ID> --json      # 항목 하나
backlog draft list --plain         # 착수 전 후보
backlog draft promote <ID>         # 후보를 TG 채번으로 올린다
backlog browser --port 6420        # 웹 GUI
```
