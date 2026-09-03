# gentask

Angular 프론트엔드와 Spring Boot 백엔드 모노레포의 참조 아키텍처 저장소입니다.

## 문서 체계

저장소의 문서는 프로젝트 요구사항과 공통 참조 아키텍처의 두 영역으로 나뉩니다.

| 구분 | 위치 | 설명 |
| :--- | :--- | :--- |
| **요구사항** | `docs/prd.md` · `docs/spec/` · 트래커의 백로그 | 제품 요구사항 정의서, 유스케이스 서술서, 작업 백로그 |
| **참조 아키텍처** | `docs/architecture/` | 아키텍처 개요, 횡단 관심사, 설계 결정 기록(ADR) |

## 문서 탐색 가이드

- **개발 프로세스**: [결정-0007](docs/architecture/decisions/0007-shared-software-process.md)을 따릅니다. 요구사항 원본과 백로그 운영, 구현 및 검증 절차, 커밋 참조 규약을 규정합니다.
- **테스트 정책**: [결정-0008](docs/architecture/decisions/0008-shared-testing.md)을 따릅니다. 계층별 테스트 배치 기준과 검증 범위를 규정합니다.
- **아키텍처 개요**: [docs/architecture/index.md](docs/architecture/index.md)에서 전체 구조를 확인합니다. 공통 기술 개념과 횡단 관심사는 `docs/architecture/concepts/`의 `<영역>-<순번>-<주제>.md`를 참조합니다 (`frontend` · `backend` · `shared`).
- **코드 스타일**: 코드를 작성하기 전에 해당 영역의 코드 스타일 가이드(`FE-STY-NNN` · `BE-STY-NNN`)를 확인합니다.
- **아키텍처 결정**: 규칙이나 설계를 변경하기 전에 [9. 아키텍처 결정](docs/architecture/09-architecture-decisions.md)을 확인합니다.
- **유스케이스 서술서**: [docs/spec/작성지침.md](docs/spec/작성지침.md)의 작성 기준을 준수합니다.
- **백로그 항목**: 백로그의 원본은 **운영 트래커**이며 저장소 내 파일로 관리하지 않습니다. `gentask issue` 명령으로 조회 및 편집합니다. Epic, Story, Task, Bug는 단일 테이블에서 관리하며 `kind`로 유형을, `state`로 진행 상태를 구분합니다.
- **문서 참조 범위**: 작업에 필요한 문서만 선별하여 참조하며, 전체 문서를 불필요하게 적재하지 않습니다.

## 전역 개발 규칙

- **문서 우선 변경**: 기능 동작과 흐름이 변경되면 유스케이스 서술서를 먼저 수정합니다. 단순 UI 표면 변경(문구, 색상, 간격 등)은 서술서 수정 대상에서 제외합니다.
- **식별 번호 불변**: 대체 흐름 번호, 인수 조건 번호, 결정 기록 번호, 스타일 규칙 번호는 한 번 부여하면 변경하지 않습니다. 항목 삭제 시 결번으로 표기하고, 신규 항목은 마지막 번호 뒤에 추가합니다. (유스케이스 ID 변경 절차는 [결정-0007](docs/architecture/decisions/0007-shared-software-process.md) 참조)
- **판단과 강제의 분리**: 자동화가 가능한 규칙은 린터, 테스트, 빌드 파이프라인으로 강제합니다. 문서에는 엔지니어링 판단이 필요한 규약만 남기며, 자동화 도구로 강제되지 않는 규칙은 그 사실을 문서에 명시합니다.
- **설정값 단일 원본**: 버전, 경로, 임계값 등의 구체적인 설정값은 설정 파일에만 단일 정의하고 문서에 중복 기술하지 않습니다.
- **커밋 규약**: 커밋 제목은 `<유형>(<범위>): <제목>` 형식을 따릅니다. 세부 유형 목록과 범위, 백로그 항목 참조 방식은 [결정-0002](docs/architecture/decisions/0002-shared-contributing.md)를 준수합니다.
- **결정 기록(ADR)**: 시스템 구조, 비기능 요구사항, 라이브러리 의존성, 인터페이스 등에 영향을 주는 기술적 결정은 [템플릿](docs/architecture/decisions/0000-template.md)에 따라 ADR을 작성하여 등록합니다.

## 품질 검증

| 영역 | 검증 명령 |
| :--- | :--- |
| 프론트엔드 | `cd clients && npm run check -w web` |
| 백엔드 | `cd server && ./gradlew build` |
| 에이전트 CLI | `cd clients && npm run check -w gentask` |
| E2E 테스트 | `cd clients/apps/web && npm run e2e` |

- 모든 검증 명령을 정상 통과한 상태에서만 커밋과 병합을 진행합니다.
- 세부 검사 항목과 실패 기준은 영역별 개발 환경 문서를 참조합니다.

## 에이전트 스킬 관리

- 스킬 원본(`.agents/skills/`)을 직접 수정합니다.
- Claude Code 환경에서 동기화가 필요한 경우 아래 명령을 실행합니다.

```bash
npx --yes skills@latest add ./.agents/skills --skill '*' -a claude-code -y
```

- `.agents/skills/`는 팀 공용 스킬만 `.gitignore` 예외로 등록하여 커밋합니다.
- `.claude/skills/` 사본과 `skills-lock.json`은 커밋 대상에서 제외합니다.

## 배포 관리

- 배포 절차와 서버 구성은 [7. 배포 뷰](docs/architecture/07-deployment-view.md)를 따릅니다.
- 접속 대상 주소와 서버 내 경로는 환경변수로 분리하고, 실제 값은 버전 관리에서 제외된 `.deploy.env`에 정의합니다.

## 백로그 및 이슈 관리

- **단일 원본(SSOT)**: 백로그의 원본은 운영 환경(`gentask.xyz`)의 트래커입니다. 저장소 내 `backlog/` 파일은 사용하지 않으며, 백로그 조회와 편집은 `gentask` CLI와 웹 인터페이스를 통해서만 수행합니다. (근거: [결정-0007](docs/architecture/decisions/0007-shared-software-process.md))
- **로컬 서버 배제**: 백로그 관리 시 로컬 개발 서버(`localhost:8080`)는 참조하지 않습니다. 로컬 서버는 개발 중에만 임시 기동하므로, 상시 가용성을 보장하는 운영 환경 트래커를 단일 참조점으로 사용합니다.
- **항목 식별자 체계**: 항목 ID는 접두어와 일련번호 조합(예: `GT-43`)으로 구성하며, 계층과 무관하게 단일 수열로 채번합니다. 계층 구조는 식별자가 아닌 부모 참조 필드로 관리하며 `--parent` 옵션으로 연결합니다.
- **인수 조건 형식**: 인수 조건은 본문 내 `- [ ] #<n> <문장>` 형태의 체크 항목으로 기술합니다. 특정 경계 블록 없이 본문 전체에 포함된 번호 매김 체크 항목을 모두 인식합니다.
- **결번 처리**: 인수 조건이 삭제되더라도 번호는 유지하며 문구를 `(결번)`으로 수정합니다. 한 번 부여된 번호는 불변입니다.
- **착수 후보 상태**: 유스케이스 서술서가 아직 없는 기획 단계의 작업 항목은 `BACKLOG` 상태로 분류합니다. 별도 목록으로 분리하지 않고 상태 속성으로 통합 관리합니다.
- **Epic 구성 기준**: Epic 할당은 선택 사항입니다. 사용자 가치를 직접 제공하지 않는 기술 작업은 최상위 Task로 등록하며, 하위 항목이 하나뿐인 불필요한 Epic은 생성하지 않습니다.
- **프로젝트 식별자와 접두어 구분**: URL 경로와 명령줄 인자에는 프로젝트 고유 식별자(NanoID)를 사용하고, 접두어(`GT`)는 작업 아이템 번호 표기에만 사용합니다. (근거: `GT-60`)
- **디렉터리 기반 프로젝트 컨텍스트**: `project use` 설정은 현재 작업 디렉터리 경로를 기준으로 저장됩니다. 저장소마다 독립된 프로젝트를 지정할 수 있으며, 하위 디렉터리에서 명령 실행 시 가장 가까운 상위 경로의 설정을 상속합니다.

```bash
gentask project list                                  # 프로젝트 목록 및 고유 식별자 조회
gentask project use 9G5xhlf0c_6t                      # 현재 디렉터리의 대상 프로젝트 설정
gentask issue list                                    # 미완료 작업 항목 목록 조회
gentask issue list --all --json                       # 전체 작업 항목 JSON 포맷 출력
gentask issue show GT-30                              # 본문 및 인수 조건 상세 조회
gentask issue add "작업 제목" --kind STORY --parent GT-41 # 상위 항목이 지정된 스토리 추가
gentask issue edit GT-30 --body "내용..."             # 지정한 필드만 부분 수정
gentask issue state GT-30 STARTED                     # 작업 진행 상태 변경
gentask issue rm GT-30 --yes                          # 항목 삭제 (--yes 생략 시 대상만 미리보기)
```
