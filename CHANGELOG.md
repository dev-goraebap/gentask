# 변경 이력

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) · 베이스라인(태그) 단위로 절을 만든다.
분류: Added(추가) / Changed(변경) / Fixed(수정) / Removed(제거)

## [미출시]

### Added

- 프로젝트 초기 스캐폴드: Angular 22 (`web/`), Spring Boot 4.1 + jOOQ + PostgreSQL (`server/`)
- 프로세스 문서 체계: AGENTS.md(법전), 계획, 요구사항 5종, 결정기록, 참고 자료
- web 코딩 표준: angular-eslint 22(flat config) + eslint-config-prettier 연결, `lint`/`format:check` 스크립트 (#1)
- server 코딩 표준: Spotless(palantir-java-format) + Checkstyle 13.8 + SpotBugs, `check` 태스크 연결 (#2, 결정-0004)
- CI 게이트: PR·main push 시 web(린트+포맷+빌드+테스트), server(빌드+린트) 검증 (#4)
- 에이전트 자산 체계: 검토 페르소나 4종(qa-auditor, release-auditor, doc-sync, security-reviewer)을 개방 표준 위치(`.agents/skills/`)에 스킬로 제공, Claude용 동기화 스크립트 포함 (#3, 결정-0006)
- 부트스트랩 스크립트: 파생 프로젝트 초기화(정체성 교체, 문서 리셋, 기능 선택) 자동화 (#5)
- 라인엔딩 정책(`.gitattributes`): 텍스트는 LF 통일(bat만 CRLF) — 로컬/CI 포맷 판정 일치 (#12)
- 설계 문서 3종 — 인프라 아키텍처 1 + 애플리케이션 아키텍처 2(웹·서버) — 과 결정기록 4건(서버 모듈 구조, 프론트 FSD 채택, DTO record 허용, 조회 경로 설계) (#14, #16)
- 웹 렌더링·로딩 규칙: URL 접두사 기반 하이브리드 렌더링, 리졸버 + 임계 시간 오버레이, 에러 유형별 분기, 빈 상태 3케이스 (결정-0011·0012)
- server 기반 배선: 패키지 루트 `dev.goraebap.devkit`, Flyway, jOOQ 코드 생성(DDLDatabase), Testcontainers 통합 테스트, ArchUnit 7규칙, 스키마 헬스 인디케이터 (#20, 결정-0013)
- 인증 세션 방식 결정 및 AUTH-*·MAIL-* 요구사항 확정 (#22, 결정-0014)
- 이메일 소유 증명 방식 결정 — 제공자 이메일을 신뢰하지 않고 자체 OTP로 증명, 소유 증명 전에는 계정을 만들지 않는다 (결정-0015)
- 메일 발송 인프라 결정 — Gmail SMTP 어댑터 + 비동기 발송, 트랜잭션 커밋 이후 트리거, 재발송으로 복구 (결정-0016)
- 신규 요구사항 — AUTH-07(비밀번호 재설정, 전 세션 무효화 포함), AUTH-08(이메일 복구), PROF-05(이메일 변경). 로그인 불가 상태의 복구 흐름과 이메일 변경이 요구사항에 없던 공백을 채운다
- 서버.md §1.6 이메일 소유 증명 계약 — 대기 레코드 식별자 기반 검증, 2단계 소셜 로그인, 세션 미승격 규약
- 디자인 시스템 결정기록 3건 — 토큰 아키텍처(결정-0017, DTCG 빌드 미도입 근거 포함), 컴포넌트 워크벤치(결정-0018), 컴포넌트 동작 조달(결정-0019) (#26)
- 1차 UI 컴포넌트 8종(`web/src/shared/ui`) — Button · Input · Field · OtpInput · Alert · Card · Link · Spinner. 네이티브 요소 위에 속성 선택자로 얹어 폼 연동·의미를 그대로 쓴다. Field가 `label[for]`↔`id`·`aria-describedby`·`aria-invalid` 배선을 담당하고, OtpInput은 자리마다 입력을 두지 않고 투명한 입력 하나로 붙여넣기·자동완성·스크린리더를 네이티브로 얻는다 (#26)
- `docs/설계/디자인시스템.md` — 톤 & 매너, 색 역할 체계, 타이포그래피, 형태, 깊이, 모션, 컴포넌트 규칙, Do/Don't. 출처 팩 문서 없이도 판단할 수 있게 자족적으로 작성했다 (#26)
- 경로 별칭 `@/shared/*`·`@/app/*` (웹.md §4). `baseUrl`은 TypeScript 7에서 제거되므로 쓰지 않는다 (#26)
- 라이트·다크 양쪽 지원 — 색상은 `light-dark()`로 두 값을 한 줄에 선언해 모드별 블록이 어긋날 여지를 없앴다. 기본은 OS 선호를 따르고 `[data-theme]`으로 덮으며, 하위 트리에도 걸 수 있어 밝은 페이지 안의 어두운 영역이 공짜로 얻어진다. 라이트는 그림자가, 다크는 표면 색이 층위를 만든다 (#26)
- 팔레트 대비 검증 테스트 — 실제 CSS를 파싱해 WCAG 대비를 계산한다(33건). 본문·보조 텍스트는 AA 4.5:1, 비활성·경계선·채움은 UI 3:1. 팔레트 값이나 매핑이 바뀌면 그 자리에서 실패한다 (#26)
- Pretendard 자체 호스팅 — 변수 폰트 + 동적 서브셋(92개 유니코드 범위)으로 쓰인 글자 범위만 내려받는다. 한글·라틴을 한 서체로 덮어 섞인 문장에서 굵기·리듬이 어긋나지 않는다. OFL-1.1 (#26)
- 디자인 토큰 3계층 — 프리미티브(`app/styles/themes/halo.css`) → 시맨틱(`app/styles/tokens.css`, Tailwind 4 `@theme`) → 컴포넌트. 컴포넌트는 시맨틱만 읽으므로 테마 교체가 파일 한 줄 교체다. 표면 3단·전경 3단·경계선·액센트·의도 4종(success·warning·info·danger)·타입 스케일 9종·반경 5종·깊이 3종. 토큰 참조 화면을 Storybook 스토리로 제공한다 (#26)
- 전역 기반 스타일 — `scrollbar-gutter: stable`(스크롤바 등장으로 인한 레이아웃 시프트 방지), `:focus-visible` 링, `prefers-reduced-motion` 대응 (#26)
- 컴포넌트 워크벤치 Storybook — `@storybook/angular-vite`. Angular 22 zoneless에서 dev·빌드 모두 동작함을 시그널 갱신으로 검증했다(zone.js 미설치 유지). `format:check`가 `.storybook`도 검사한다 (#26)
- 인증 스키마 4테이블 — `users`·`sessions`·`accounts`·`verifications` (`V2__auth_schema.sql`). 결정-0015의 불변식을 DB 제약으로 강제한다: `email_verified_at` NOT NULL(미검증 사용자를 표현할 수 없다), `verifications`에 유일성 제약 없음(대기 시도가 이메일을 선점하지 못한다), `(provider, provider_account_id)` 유니크 (#24, AUTH-06)
- `docs/설계/데이터베이스.md` — 불변식↔제약 대응 표, 대기 레코드 수명주기, jOOQ DDLDatabase(인메모리 H2 경유)가 스키마에 거는 제약과 `[jooq ignore]` 우회 (#24)
- `AuthSchemaTest` — 스키마가 불변식을 실제로 막는지 검증하는 통합 테스트 9건. "제약의 부재"(대기 레코드 이메일 중복 허용)도 테스트로 고정했다 (#24)
- 결정기록 보충 자료(`docs/참고/결정-0014-보충-세션-방식.md`) — 결정-0014의 선택 배경·조회 비용 정량 비교·렌더링 모드별 영향·표준 현황(IETF BCP 초안·OWASP·RFC 9068/7662). 결정의 정본은 결정-0014이며 이 문서는 결정을 바꾸지 않는다. 보충 자료의 명명은 `결정-NNNN-보충-<주제>.md`를 따른다

### Changed

- 서버.md §1에 인증 계약 절 추가, 모듈 트리의 근거 없는 `token/` 세그먼트를 `mail/`로 정정 (#22)
- AUTH-01 이메일 검증 정책을 "가입 후 검증"에서 "OTP 선행"으로 변경 — 미검증 계정을 남기지 않는 것이 pre-hijacking 계열 공격의 전제를 없애는 방법이기 때문 (결정-0015)
- AUTH-05 통합 키를 "제공자가 준 이메일"에서 "우리가 검증한 이메일"로 변경. 연동 규칙은 기존 방침(기존 계정 발견 시 로그인 후 연동) 유지 (결정-0015)
- AUTH-02~04에서 이메일 scope 요구를 제거하고 소셜 최초 로그인을 2단계로 변경. 제공자별 이메일 검증 신호 유무(네이버는 제공하지 않음)에 의존하지 않게 됐다 (결정-0015)
- auth 모듈 트리에 `recovery/` 피쳐 추가 (AUTH-07·08)
- 계획.md M1·M2 범위에 신규 요구사항 반영
- 웹.md §4에 Angular 제약 2건 추가 — 템플릿에서 참조되는 식별자는 ASCII여야 한다(Angular 템플릿 파서가 한글 식별자를 거부하며 TypeScript는 허용하므로 컴파일 단계에서야 드러난다), 투영된 콘텐츠는 DI로 부모를 찾지 못하므로 `contentChild`로 협력한다 (#26)
- ESLint 선택자 규칙에 `ui` 접두사와 attribute 타입 허용, 표기는 kebab-case로 통일 — `<button ui-button>`·`<input ui-input>` (#26)
- 서버.md §9 테스트 규약 보강 — 요구사항 ID는 `@DisplayName`에 둔다(메서드명의 `AUTH_06`은 하이픈 검색에 걸리지 않아 추적성이 끊긴다). 한국어 완화는 메서드명에만 적용되며 지역변수·파라미터는 프로덕션과 같은 규칙을 따른다 (#24)

### Fixed

- server 테스트가 DB 설정 부재로 실패하던 문제 — Testcontainers 도입으로 해결하고 CI 게이트에 편입 (#7)

### Removed

- 인증 세션 방식 참고 문서 중복분 2건(`세션-vs-JWT-논쟁-대응.md`, `인증-세션-방식-기술검토서.md`) — 같은 내용의 초기 판이며 `결정-0014-보충-세션-방식.md`로 통합
