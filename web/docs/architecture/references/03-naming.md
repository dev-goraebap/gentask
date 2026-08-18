# 03. 명명 규칙

본 문서는 파일명, 클래스명, 선택자, 슬라이스명의 규약을 정의합니다.

두 개의 규약을 결합합니다. **파일과 클래스는 Angular 스타일 가이드를 따르고, 세그먼트 내부의 파일 분할은 FSD 의 도메인 기반 명명을 따릅니다.**

## 1. 기준판 고정

Angular 스타일 가이드는 **2025년 개정판**을 기준으로 합니다.

이 개정에서 파일명의 타입 접미사(`.component.ts`, `.service.ts`, `.directive.ts`)가 제거되었습니다. Angular CLI 의 `fileNameStyleGuide` 옵션 값 `2025` 에 해당하며, `ng new` 가 생성하는 루트 컴포넌트가 `app.component.ts` 가 아니라 `app.ts` 인 것이 이 규약의 적용 결과입니다.

기준판을 고정하지 않으면 CLI 생성물과 문서의 규약이 어긋나 생성할 때마다 파일명을 손으로 고치게 됩니다.

## 2. 파일명

### 2.1 형식

모든 파일명은 **케밥 케이스**를 사용합니다. 타입 접미사를 붙이지 않습니다.

| 대상 | 파일명 |
| :--- | :--- |
| 컴포넌트 | `task-row.ts`, `task-row.html` |
| 라우트 진입 컴포넌트 | `task-list.page.ts`, `task-list.page.html` |
| 서비스 | `session.ts` |
| 가드 | `auth-guard.ts` |
| 인터셉터 | `auth-interceptor.ts` |
| 파이프 | `format-date.ts` |
| 모델·타입 | `task.ts` |

가드와 인터셉터는 접미사를 유지합니다. 이름만으로 역할이 드러나지 않으면 라우트 정의나 프로바이더 배열에서 무엇인지 판별할 수 없기 때문입니다.

### 2.1.1 라우트 진입 컴포넌트

**`pages` 슬라이스의 라우트 진입 컴포넌트는 `.page` 접미사를 갖습니다.** 클래스명도 `Page` 로 끝냅니다.

`ui/` 세그먼트는 평면으로 유지하므로 화면이 커지면 표현 컴포넌트가 같은 자리에 나란히 쌓입니다. 그때 어느 것이 라우터가 여는 진입점인지 파일 목록만으로는 판별되지 않습니다. 슬라이스명과 같은 이름이라는 관례에 기대면 `task-list.ts` 와 `task-list-row.ts` 가 나란히 정렬되어 구분이 사라집니다.

`.page` 는 Angular 타입을 되풀이하는 접미사가 아니라 **FSD 에서의 역할 표시**이므로 1절의 기준판과 충돌하지 않습니다. 가드와 인터셉터에 접미사를 남긴 것과 같은 근거입니다.

| 대상 | 파일 | 클래스 | 선택자 |
| :--- | :--- | :--- | :--- |
| **라우트 진입** | `task-list.page.ts` | `TaskListPage` | `app-task-list` |
| **표현 컴포넌트** | `task-row.ts` | `TaskRow` | `app-task-row` |

선택자에는 `-page` 를 붙이지 않습니다. 페이지 컴포넌트의 선택자는 템플릿에 나타나지 않으며 라우터가 인스턴스화합니다.

`app` 계층의 레이아웃은 대상이 아닙니다. 라우트가 여는 화면이 아니라 화면을 담는 골격이기 때문입니다.

**이 규칙에는 자동 강제 수단이 없습니다.** ESLint 에 파일명 패턴 규칙이 없고 Steiger 는 접미사를 보지 않으므로 코드 리뷰에서 확인합니다.

### 2.2 도메인 기반 분할

세그먼트 안에서 파일을 나눌 때는 **다루는 도메인**으로 이름 짓습니다. 기술적 역할로 짓는 것을 **금지**합니다.

| 구분 | 준수 지침 (Do) | 금지 지침 (Don't) |
| :--- | :--- | :--- |
| **모델** | `model/task.ts` | `model/types.ts` |
| **유틸** | `lib/format-due-date.ts` | `lib/utils.ts` |
| **요청** | `api/fetch-tasks.ts` | `api/api.ts` |
| **상수** | `config/task-status.ts` | `config/constants.ts` |

`types.ts` 와 `utils.ts` 가 금지되는 이유는 무관한 도메인이 한 파일에 섞이기 때문입니다. 파일명으로 내용을 알 수 없어 열어 봐야 하고, 시간이 지나면 무엇이든 들어가는 자리가 됩니다.

세그먼트에 도메인 관심사가 하나뿐이면 파일명이 슬라이스명과 같아도 됩니다. `features/auth/model/auth.ts` 형태입니다.

### 2.3 요청 함수 파일

동사로 시작해 무엇을 하는지 드러냅니다.

| 동작 | 파일명 |
| :--- | :--- |
| 목록 조회 | `fetch-tasks.ts` |
| 단건 조회 | `fetch-task.ts` |
| 생성 | `create-task.ts` |
| 수정 | `update-task.ts` |
| 삭제 | `delete-task.ts` |

## 3. 클래스명과 심볼명

### 3.1 클래스

**파스칼 케이스**를 사용하며 타입 접미사를 붙이지 않습니다.

| 대상 | 클래스명 |
| :--- | :--- |
| 컴포넌트 | `TaskRow` |
| 라우트 진입 컴포넌트 | `TaskListPage` |
| 서비스 | `SessionStore` |
| 디렉티브 | `Autofocus` |
| 파이프 | `FormatDate` |

`TaskRowComponent` 가 아니라 `TaskRow` 입니다. 접미사는 정보를 더하지 않으며 파일 위치(`ui/` 세그먼트)가 이미 역할을 드러냅니다.

라우트 진입 컴포넌트만 `Page` 로 끝냅니다. 이것은 Angular 타입이 아니라 역할이며 근거는 2.1.1절에 있습니다.

서비스는 역할을 드러내는 명사로 이름 짓습니다. `SessionService` 처럼 `Service` 로 끝내는 대신 `SessionStore`, `InvalidationBus` 처럼 무엇을 하는지 담습니다.

### 3.2 함수

| 대상 | 형식 | 예시 |
| :--- | :--- | :--- |
| 주입 헬퍼 | `inject` 접두사 | `injectInteractionMode`, `injectTask` |
| 조회 요청 | `fetch` 접두사 | `fetchTasks` |
| 변경 요청 | 동사 | `completeTask`, `deleteTask` |
| 계산 | 동사 | `calculateProgress`, `formatDate` |
| 판정 | `is` · `has` · `can` 접두사 | `isExpired`, `hasPermission` |

### 3.3 타입

생성된 서버 타입은 생성기가 정한 이름을 그대로 사용합니다. 손으로 고치지 않습니다. 서버 어휘가 화면 코드에 드러나는 것은 [14. API 계약 소비](14-api-contract.md)에서 감수하기로 한 대가입니다.

직접 정의하는 타입은 파스칼 케이스를 사용하며 `I` 접두사나 `Type` 접미사를 붙이지 않습니다.

> **주의: 템플릿에 노출되는 식별자에 한글을 쓸 수 없습니다**
>
> Angular 템플릿 표현식 파서가 한글 식별자를 `NG5002 Lexer Error` 로 거부합니다. TypeScript 자체는 허용하므로 작성 시점에는 드러나지 않고 컴파일 단계에서야 실패합니다. 템플릿과 호스트 바인딩에 노출되는 멤버는 `protected` 를 포함해 영문으로 쓰고, 한글은 노출되지 않는 지역 변수와 `private` 멤버에만 씁니다.

## 4. 선택자

컴포넌트 선택자는 `app` 접두사와 케밥 케이스를 사용합니다.

```ts
@Component({ selector: 'app-task-list' })
```

접두사는 `angular.json` 의 `prefix` 설정이 원본입니다. 프로젝트별로 다른 접두사를 쓸 수 있으나 한 프로젝트 안에서는 일관되어야 합니다.

디렉티브 선택자는 접두사를 붙인 카멜 케이스 속성 형태를 사용합니다.

```ts
@Directive({ selector: '[appAutofocus]' })
```

`shared/ui` 의 helm 사본은 예외입니다. `hlm` 접두사가 Spartan 규약이며 `app` 으로 바꾸면 재생성 때마다 되돌아옵니다. 예외의 등재 위치는 [01. 개발 환경](01-dev-environment.md) 8절입니다.

## 5. 슬라이스명

### 5.1 형식

케밥 케이스를 사용하며 계층에 따라 품사가 다릅니다.

| 계층 | 품사 | 예시 |
| :--- | :--- | :--- |
| **pages** | 화면을 나타내는 명사구 | `task-list`, `task-detail` |
| **features** | 사용자 동작을 나타내는 동사구 | `task-complete`, `file-upload` |
| **entities** | 도메인 개념을 나타내는 명사 | `task`, `project` |

`features` 와 `entities` 의 품사 차이가 두 계층의 판정 기준입니다. 이름을 지을 때 동사구가 자연스러우면 `features`, 명사가 자연스러우면 `entities` 입니다.

### 5.2 pages 슬라이스명

라우트 경로와 대응시킵니다. 라우트를 보고 슬라이스를, 슬라이스를 보고 라우트를 찾을 수 있어야 합니다.

| 라우트 | 슬라이스 |
| :--- | :--- |
| `/tasks` | `task-list` |
| `/tasks/:id` | `task-detail` |
| `/tasks/:id/edit` | `task-edit` |
| `/tasks/new` | `task-create` |

목록·상세·편집·생성은 각각 별도 슬라이스입니다. 접미사를 `-list`, `-detail`, `-edit`, `-create` 로 통일해 화면 성격이 이름에서 드러나게 합니다.

### 5.3 금지

| 금지 | 사유 |
| :--- | :--- |
| 슬라이스명에 계층명 포함 (`task-page`) | 경로에 이미 `pages/` 가 있습니다 |
| 지나치게 넓은 슬라이스명 (`common`, `misc`, `management`) | 무엇이든 들어가는 자리가 됩니다 |
| 축약어 (`tsk`, `usr`) | 검색되지 않고 읽는 사람마다 다르게 해석합니다 |
| `shared` 의 세그먼트명과 겹치는 그룹명 | Steiger `ambiguous-slice-names` 가 빌드를 실패시킵니다 |

`user-management` 같은 광범위한 이름은 시간이 지나면 여러 책임이 뒤섞입니다. `auth`, `profile-edit`, `password-reset` 처럼 책임 단위로 나눕니다.

## 6. 상수와 열거값

상수는 대문자 스네이크 케이스를 사용합니다.

```ts
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
```

열거 대신 유니온 타입과 `as const` 객체를 우선합니다. TypeScript 의 `enum` 은 런타임 코드를 생성하고 `isolatedModules` 환경에서 제약이 있습니다.

```ts
export const TASK_STATUS = {
  todo: 'TODO',
  doing: 'DOING',
  done: 'DONE',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
```

## 7. 자동 강제

| 규칙 | 강제 수단 |
| :--- | :--- |
| 선택자 접두사와 형식 | `angular-eslint` 규칙 |
| 클래스 접미사 금지 | `angular-eslint` 규칙 |
| 도메인 기반 파일명 | Steiger `inconsistent-naming`, `ambiguous-slice-names`, `segments-by-purpose` (부분) |
| 파일명 케밥 케이스 | ESLint 파일명 규칙 |

Steiger 의 명명 규칙은 슬라이스와 세그먼트 수준의 위반만 검출합니다. **파일 하나가 여러 도메인을 담고 있는지는 판정하지 못하므로** 코드 리뷰에서 확인합니다.

**라우트 진입 컴포넌트의 `.page` 접미사도 강제되지 않습니다.** ESLint 에 파일명 패턴 규칙이 없고 Steiger 는 접미사를 보지 않습니다. 규칙을 어겨도 빌드가 통과하므로 같은 자리에서 확인합니다.
