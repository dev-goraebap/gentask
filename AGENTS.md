# gentask

Angular 프론트엔드와 Spring Boot 백엔드 모노레포의 참조 아키텍처 저장소입니다.

## 두 축

| 축 | 위치 | 성격 |
| :--- | :--- | :--- |
| **요구사항 축** | `docs/prd.md` · `docs/spec/` · 트래커의 백로그 | 프로젝트별 요구사항 |
| **참조 아키텍처** | `docs/architecture/` | 프로젝트 공통 참조 아키텍처 |

## 문서 탐색 순서

- **개발 프로세스**: [결정-0007](docs/architecture/decisions/0007-shared-software-process.md)을 따릅니다. 요구사항의 원본과 백로그, 구현과 검증, 추적의 규약이 여기 있습니다.
- **테스트**: [결정-0008](docs/architecture/decisions/0008-shared-testing.md)을 따릅니다. 어느 층에 무엇을 두고 무엇을 두지 않는가가 여기 있습니다.
- **아키텍처**: [docs/architecture/index.md](docs/architecture/index.md)부터 진입합니다. 횡단 관심사 문서는 `docs/architecture/concepts/`의 `<축>-<순번>-<주제>.md`를 확인합니다 (`frontend` · `backend` · `shared`).
- **코드 스타일**: 코드를 작성하기 전에 해당 축의 코드 스타일 가이드(`FE-STY-NNN` · `BE-STY-NNN`)를 확인합니다.
- **아키텍처 결정**: 규칙이나 설계를 변경하기 전에 [9. 아키텍처 결정](docs/architecture/09-architecture-decisions.md)을 확인합니다.
- **유스케이스 서술서**: [docs/spec/작성지침.md](docs/spec/작성지침.md)를 따릅니다.
- **백로그 항목**: 원본은 **트래커**이며 저장소에 파일로 두지 않습니다. `gentask issue` 명령으로 읽고 씁니다. Epic · Story · Task · Bug 가 한 자리에 있고 `kind` 가 유형을, `state` 가 상태를 가릅니다.
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
| 에이전트 | `cd clients && npm run check -w gentask` |
| 추적 | `npm run backlog:export --prefix clients/apps/cli` 뒤 `node scripts/trace-check.mjs` |

- 검증을 통과하지 않은 상태로 커밋하거나 병합하지 않습니다.
- 추적 검사는 인수 조건과 테스트 이름을 대조합니다. 없는 인수 조건을 가리키는 접두어는 실패이고, 테스트가 없는 인수 조건은 목록으로만 냅니다.
- **검사 전에 백로그를 내려야 합니다.** 원본이 트래커이므로 사본(`.backlog.json`)이 없거나 오래되면 검사가 옛 것을 봅니다. 검사기는 사본이 아예 없으면 무엇을 해야 하는지 알립니다.
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

- **원본은 트래커입니다.** 저장소에 `backlog/` 파일을 두지 않으며, 읽고 쓰는 것은 `gentask` CLI 와 웹 화면입니다. 옮긴 근거는 [결정-0007](docs/architecture/decisions/0007-shared-software-process.md)이 갖습니다.
- 항목 ID 는 `GT-43` 처럼 접두어와 번호이며 **평평하게** 매깁니다. 계층은 번호가 아니라 부모가 갖고 `--parent` 로 잇습니다.
- 인수 조건은 본문 안의 `- [ ] #<n> <문장>` 체크 항목입니다. **경계를 표시하지 않으며** 본문 어디에 있든 번호가 붙은 체크 항목을 모두 읽습니다.
- 결번은 번호를 지우지 않고 문장을 `(결번)` 으로 바꿔 표시합니다. 번호는 부여 뒤 불변입니다.
- 서술서가 아직 없는 착수 후보는 `BACKLOG` 상태로 둡니다. 별도 목록이 아니라 상태 하나입니다.
- Epic 소속은 선택입니다. 사용자 가치를 직접 내지 않는 기술 작업은 최상위 Task 로 두고, 자식 하나뿐인 Epic 을 만들지 않습니다.

- **프로젝트를 가리키는 것과 이슈의 접두어는 다릅니다.** 주소와 명령줄 인자가 담는 것은 프로젝트의 식별자(nanoid)이고, 접두어(`GT`)는 작업 아이템의 이름에만 쓰입니다. 근거는 `GT-60` 이 갖습니다.
- **`project use` 는 지금 디렉터리에 매여 저장됩니다.** 저장소마다 다른 프로젝트를 가리킬 수 있으며, 하위 디렉터리에서 불러도 가장 가까운 자리의 것을 씁니다.

```bash
gentask project list                         # 내 프로젝트와 그 식별자
gentask project use 0a6259b9cd01             # 이 자리의 프로젝트를 정한다
gentask issue list                           # 닫히지 않은 것
gentask issue list --all --json              # 전부를 JSON 으로
gentask issue show GT-30                     # 본문과 인수 조건까지
gentask issue add "제목" --kind STORY --parent GT-41
gentask issue edit GT-30 --body "..."        # 넘긴 것만 바꾼다
gentask issue state GT-30 STARTED
gentask issue rm GT-30 --yes                 # --yes 없이는 지울 것만 보인다
```

- **추적 검사는 내린 사본을 읽습니다.** `.backlog.json` 이 그것이며 추적되지 않습니다. 검사가 API 를 직접 부르면 서버와 토큰 없이는 돌지 않게 되므로 내리는 한 단계를 둡니다.

```bash
npm run backlog:export --prefix clients/apps/cli   # 트래커 → .backlog.json
node scripts/trace-check.mjs                       # 그 사본을 읽어 대조
```
