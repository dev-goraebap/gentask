# 결정-0004: server 정적분석 도구 — Spotless(palantir) + Checkstyle + SpotBugs

- 상태: 승인됨
- 날짜: 2026-07-23

## 맥락

SP 2.4.1(구현 표준 정의·준수 검토)을 server 쪽에서 충족할 도구가 필요했다.
web은 Prettier(포맷) + angular-eslint(품질)로 역할 분리를 확립한 상태(#1)라,
server도 같은 구도를 유지하는 것이 파생 프로젝트의 이해 비용을 낮춘다.

당시 전제: Gradle 9.5.1, Java 21, Spring Boot 4.1, Lombok 사용.
검증된 버전: Spotless 플러그인 8.8.0(최소 Gradle 8.1), Checkstyle 13.8.0, SpotBugs 플러그인 6.5.9(SpotBugs 4.10.x).

## 검토한 대안

- **Spotless + Checkstyle + SpotBugs (선택)**: 포맷·컨벤션·버그탐지 전부 커버. 빌드 시간 소폭 증가
- **Spotless + Checkstyle만**: 가볍지만 버그 패턴 탐지 부재
- **Spotless + Error Prone**: 컴파일 시점 탐지가 강력하나 Lombok과 어노테이션 처리 순서 마찰이 알려져 있어 제외
- **Spotless만**: 포맷 통일뿐, 품질 규칙이 없어 SP 2.4.1 충족에 부족

## 결정

| 도구 | 역할 | web 대응물 |
|---|---|---|
| Spotless + palantir-java-format | 포맷 전담 | Prettier |
| Checkstyle (경량 규칙셋) | 컨벤션·구조 검사 | ESLint 스타일 규칙 |
| SpotBugs | 버그 패턴 탐지 (바이트코드 분석) | ESLint 품질 규칙 |

- Checkstyle 규칙셋은 포맷 규칙을 넣지 않는다 — 포맷은 Spotless 전담 (web의 eslint-config-prettier와 같은 원칙)
- SpotBugs는 바이트코드 분석이라 Lombok 생성 코드 기준으로 검사되어 마찰이 적다
- 세 도구 모두 `./gradlew check`에 연결되어 CI 게이트(#4)의 재료가 된다

## 결과

- web/server가 대칭 구도(포맷 전담 + 품질 전담)를 갖춰 파생 프로젝트의 학습 비용 감소
- SP 2.4.1(표준 정의·준수 검토), 3.3(측정 지표: 위반 건수) 충족의 실체 확보
- 감수하는 것: check 태스크 빌드 시간 증가, SpotBugs 오탐 발생 시 필터 관리 비용
