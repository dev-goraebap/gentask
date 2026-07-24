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
