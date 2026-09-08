# Gentask

## MCP 사용 기준

- **`gentask-local`** (`http://localhost:8080/api/mcp`): 로컬에서 구현한 기능을 확인하고 테스트 데이터를 생성·수정·조회할 때 사용합니다.
- **`gentask`** (`https://gentask.xyz/api/mcp`): Gentask 서비스의 실제 요구사항·지침·문서를 조회하고 관리할 때 사용합니다. 운영 데이터를 로컬 테스트용으로 변경하지 않습니다.

요구사항과 지침의 원본은 운영 Gentask의 아티팩트입니다. CLI 대신 MCP 도구를 사용합니다.

## 도그푸딩과 프론트엔드

Gentask는 우리가 만든 플랫폼을 개발환경에서 직접 사용하는 도그푸딩 대상으로 개발합니다. 작업 등록, 아티팩트 작성·버전 관리, 블록 코멘트, MCP를 통한 에이전트 협업을 실제 사용 흐름으로 검증합니다. 개발 데이터는 `gentask-local`에서 다루고, 확정된 요구사항과 지침은 운영 `gentask` 아티팩트에 반영합니다.

프론트엔드는 `clients/apps/main`의 **React·TypeScript·Vite·TanStack Router·TanStack Query·Astryx**를 사용합니다. UI 구현 전 운영 architecture/concepts의 프론트엔드 01~05를 확인하고 Astryx의 컴포넌트·레이아웃·테마 계약을 따릅니다. Angular·Spartan·CDK 기반의 과거 지침은 현재 앱에 적용하지 않습니다.

## 작업 전 확인할 문서

운영 `gentask` MCP에서 **Gentask 프로젝트**(`9G5xhlf0c_6t`)의 관련 아티팩트를 확인합니다.

- **개발 프로세스**: 개발·테스트·PR·릴리스·마이그레이션 절차. 문서 식별자는 `gCxQBXaluaLP`입니다.
- **아키텍처**: `architecture` 폴더와 하위 `concepts`, `decisions`의 구조·기술 지침·결정 기록.
- **유즈케이스 (`spec`)**: 해당 기능의 동작과 인수 조건.
- **PRD**: 제품 목적과 요구사항. 문서 식별자는 `hsQYG6LLY6kx`입니다.

`list_artifact_folders`와 `list_artifacts`로 관련 문서를 찾고, `get_artifact`로 최신 본문을 읽습니다. 이때 `projectId`는 `9G5xhlf0c_6t`를 사용합니다.

PR 본문, 문서, 코드 주석, 테스트, 커밋 메시지를 작성하기 전에는 `지침` 폴더의 **작성 지침**(`CpprVVe_Q4gl`)과 **교정 사례**(`wc7wstpaUvL2`)도 확인합니다.

기존 `AGENTS.md` 전체 내용은 운영의 [개발 프로세스](https://gentask.xyz/projects/9G5xhlf0c_6t/artifacts/gCxQBXaluaLP) 문서에 보존되어 있습니다. 해당 문서의 현재 MCP 기준을 적용합니다.
