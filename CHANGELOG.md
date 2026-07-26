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

### Fixed

- server 테스트가 DB 설정 부재로 실패하던 문제 — Testcontainers 도입으로 해결하고 CI 게이트에 편입 (#7)
