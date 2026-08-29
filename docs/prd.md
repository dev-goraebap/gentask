# 투두젠 제품 요구사항 정의서 (Product Requirements Document)

## 1. 개요 (Overview)

투두젠(todogen)은 개인용 작업(Todo) 관리 서비스입니다. 사용자는 개인 계정에 작업을 등록하고, 스마트 목록을 통해 당일 또는 대상 작업을 선별·조회하며, 완료된 작업을 처리할 수 있습니다. 각 작업에는 마감 기한, 미리 알림, 첨부 파일 등의 속성을 지정할 수 있습니다.

기능 범위와 도메인 용어는 Microsoft To Do를 기준점으로 정의합니다.

## 2. 서비스 범위 (Scope)

### 2.1 제외 범위 (Out of Scope)

시스템 설계 및 구현의 명확성을 유지하기 위해 다음 항목은 명시적으로 서비스 범위에서 제외합니다.

- **다중 사용자 협업 기능**: 작업의 공유, 위임 및 계정 간 권한 구분을 지원하지 않습니다. 모든 데이터는 사용자 계정 단위로 엄격히 격리되며, 타 계정 리소스는 존재 여부 자체를 노출하지 않습니다.
- **비작업(Non-task) 도메인**: 일정 관리(달력/캘린더), 독립된 노트 및 문서 관리 기능을 다루지 않습니다. 기한과 미리 알림은 작업(Task)에 부속되는 속성으로만 관리합니다.
- **고가용성 및 대규모 처리량**: 단일 사용자 대상 및 단일 서버 배포 환경을 전제로 하므로 고가용성(High Availability) 및 대규모 처리량(High Throughput)은 목표 아키텍처 범위에서 제외합니다. (근거: [1.2 품질 목표](./architecture/01-introduction-and-goals.md))

### 2.2 향후 검토 범위 (Future Scope / Backlog)

현재 구현 범위에는 포함되지 않으나 향후 확장 대상으로 식별된 기능은 백로그의 Draft 로 관리합니다.

- 미리 알림의 실제 발송 및 알림 통지
- 로컬 에이전트 연동을 통한 작업 등록
- 반복 작업 생성 및 주기 관리
- 작업을 분류 및 그룹화하는 목록(List) 관리

## 3. 요구사항 명세 체계 (Requirements Specification)

본 프로젝트의 요구사항 원본(Single Source of Truth)은 유스케이스 서술서입니다. 기능 흐름은 유스케이스 서술서에 정의하며, 세부 인수 조건(Acceptance Criteria)은 Story 파일에서 관리합니다. 요구사항과 인수 조건의 분리 원칙은 [결정-0007](./architecture/decisions/0007-shared-software-process.md)에 따르며, 서술서 작성 규칙은 [작성지침](./spec/작성지침.md)을 준수합니다.

### 3.1 작업 도메인 (Task)

- [TSK-001 작업 추가](<./spec/task/TSK-001(작업 추가).md>)
- [TSK-002 작업 보기](<./spec/task/TSK-002(작업 보기).md>)
- [TSK-003 작업 편집](<./spec/task/TSK-003(작업 편집).md>)
- [TSK-004 작업 완료](<./spec/task/TSK-004(작업 완료).md>)
- [TSK-005 작업 삭제](<./spec/task/TSK-005(작업 삭제).md>)

### 3.2 계정 도메인 (User)

- [USR-001 계정 회원가입](<./spec/user/USR-001(계정 회원가입).md>)
- [USR-002 계정 로그인](<./spec/user/USR-002(계정 로그인).md>)
- [USR-003 프로필 관리](<./spec/user/USR-003(프로필 관리).md>)
- [USR-004 계정 로그아웃](<./spec/user/USR-004(계정 로그아웃).md>)
- [USR-005 비밀번호 재설정](<./spec/user/USR-005(비밀번호 재설정).md>)
- [USR-006 계정 탈퇴](<./spec/user/USR-006(계정 탈퇴).md>)

## 4. 연계 문서 (Related Documents)

- **품질 목표 및 이해관계자**: [1. 서론과 목표](./architecture/01-introduction-and-goals.md)
- **시스템 경계 및 외부 연동**: [3. 컨텍스트와 범위](./architecture/03-context-and-scope.md)
- **소프트웨어 프로세스 결정**: [결정-0007](./architecture/decisions/0007-shared-software-process.md)
- **유스케이스 작성 규칙**: [작성지침](./spec/작성지침.md)
