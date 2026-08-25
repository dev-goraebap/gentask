# 프론트엔드 참조 아키텍처

본 문서는 프론트엔드 아키텍처 규칙 체계의 진입점입니다. 개별 세부 규칙의 본문을 직접 기술하지 않고, 문서 구조와 도입 순서 및 분류 체계를 정의합니다.

분류는 [arc42](https://arc42.org/) 섹션 체계를 차용하되 필요한 섹션만 사용합니다.

## 파일명과 번호

참조 문서는 `references/NN-이름.md` 형식으로 명명하며 `NN`은 **아키텍처 도입 순서**를 의미합니다. 단순 열람 순서가 아닌 **초기 구축 및 타 프로젝트 이식 시 선행되어야 하는 의존성 순서**이며, 사후 변경 시 기존 코드에 미치는 영향도(파급 범위)를 기준으로 정의되었습니다.

| 구간 | 번호 | 시점 |
| :--- | :--- | :--- |
| **기반** | 01~04 | 첫 코드를 작성하기 전에 확정되어야 합니다 |
| **화면** | 05~13 | UI 프로토타입 단계에서 필요해집니다 |
| **연결** | 14~16 | 백엔드 연동 시점에 필요해집니다 |
| **검증** | 17~19 | 검증 게이트 이후 단계에서 필요해집니다 |

프로세스 단계와의 대응은 [프로세스 문서](../../../docs/process.md)가 원본입니다.

## §5 빌딩 블록 뷰 (Building Block View)

시스템의 정적 모듈 분할 및 컴포넌트 구조를 정의합니다.

- [02. 패키지 배치와 참조 규칙](references/02-package-structure.md) — 계층·슬라이스·세그먼트 배치 판정과 참조 규칙
- [11. 컴포넌트 설계](references/11-component-design.md) — 슬라이스 내부의 컴포넌트 분할과 입출력 계약

## §7 배포와 개발 환경 (Deployment View)

빌드 및 런타임 환경과 배포 인프라를 정의합니다.

- [01. 개발 환경](references/01-dev-environment.md) — 구성 파일의 역할과 규칙 강제 지점
- [05. 렌더링 전략](references/05-rendering.md) — 경로별 렌더링 모드의 결정 기준

## §8 횡단 개념 (Cross-cutting Concepts)

애플리케이션 전반에 공통 적용되는 횡단 관심사 규약입니다.

- [03. 코드 작성 규약](references/03-code-style.md) — 파일명·클래스명·선택자 규약과 클래스 멤버 순서
- [04. 디자인 시스템](references/04-design-system.md) — UI 킷 구성, 토큰의 그릇과 사용 규칙
- [06. 레이아웃](references/06-layout.md) — 화면 골격의 종류와 스크롤 컨테이너 규격
- [07. 적응형 UI](references/07-adaptive-ui.md) — 상호작용 특성에 따른 컴포넌트 교체 규칙
- [08. 라우팅과 네비게이션](references/08-routing.md) — 라우트 구조와 URL 이 소유하는 상태의 범위
- [09. 서버 상태와 클라이언트 상태](references/09-state.md) — 데이터 종류별 소유 계층과 갱신 규칙
- [10. 로딩 전략](references/10-loading.md) — 대기 구간의 표현 수단과 적용 경계
- [12. 폼과 검증](references/12-forms.md) — 폼 구현 수단과 검증 규칙의 위치
- [14. API 계약 소비](references/14-api-contract.md) — 서버 타입 생성과 계약 변경 대응
- [15. 예외 · 에러 표시 · 로깅](references/15-error-handling.md) — 실패 처리와 사용자 표시, 기록
- [16. 보안](references/16-security.md) — 프론트엔드가 책임지는 보안 범위와 한계

시각 언어는 이 섹션에 두지 않습니다. [DESIGN.md](../design/DESIGN.md)가 소유하며 프로젝트마다 새로 작성합니다. 분리의 근거는 [결정-0001](decisions/0001-design-outside-architecture.md)에 있습니다.

## §9 아키텍처 결정 (Architecture Decisions)

- [결정 기록 목차](decisions/index.md) — 유효·대체됨 상태와 발행 예정 목록을 포함합니다

## §10 품질 요구사항 (Quality Requirements)

- [13. 접근성](references/13-accessibility.md) — 접근성 책임 분담과 직접 구현 시 최소 기준
- [17. 테스트](references/17-testing.md) — 검증 수준별 대상과 제외 범위
- [18. 성능](references/18-performance.md) — 번들 예산의 강제와 로딩 최적화

## §12 용어집 (Glossary)

- [19. 용어집](references/19-glossary.md) — 참조 아키텍처 전반이 쓰는 용어의 정의
