# 프론트엔드 02. 코드 작성 규약

프론트엔드 애플리케이션의 파일명, 클래스명, 선택자, 슬라이스명의 명명 규약과 컴포넌트 및 서비스의 클래스 멤버 배치 순서를 정의합니다.

명명 체계는 Angular 스타일 가이드와 Feature-Sliced Design(FSD) 아키텍처의 도메인 기반 명명 규약을 결합하여 적용합니다. 파일 및 클래스 명명은 Angular 스타일 가이드를 따르고, 세그먼트 내부의 파일 분할은 FSD의 도메인 기반 명명을 따릅니다.

배치 규약은 컴포넌트(`@Component`)와 서비스(`@Injectable`)에 공통으로 적용됩니다. 본 문서의 표에 기재된 클래스명과 파일명은 규약의 형태를 설명하기 위한 대표 예시이며, 프로젝트의 전체 목록을 전수 나열한 것이 아닙니다.

## 1. 기준판 고정

Angular 스타일 가이드는 **2025년 개정판(`fileNameStyleGuide: 2025`)**을 명명 기준으로 적용합니다.

해당 기준에 따라 파일명의 Angular 타입 접미사(`.component.ts`, `.service.ts`, `.directive.ts` 등)를 생략합니다. Angular CLI 코드 생성 도구의 기본 산출물 형식(예: `app.ts`)과 프로젝트 명명 규약을 일치시켜 파일명 수동 수정 비용을 방지합니다.

## 2. 파일명

### 2.1 형식

모든 파일명은 **케밥 케이스(kebab-case)**를 적용합니다. 단일 파일에서 클래스를 내보내는 경우, 파일명은 해당 클래스명을 케밥 케이스로 변환하여 일치시킵니다.

> "File names should generally describe the contents of the code in the file. When the file contains a TypeScript class, the file name should reflect that class name." — [Angular 스타일 가이드](https://angular.dev/style-guide)

| 대상 | 클래스 (예시) | 파일명 (예시) |
| :--- | :--- | :--- |
| 컴포넌트 | `TaskRow` | `task-row.ts` · `task-row.html` |
| 라우트 진입 컴포넌트 | `TaskListPage` | `task-list.page.ts` · `task-list.page.html` |
| 서비스 | `SessionService` | `session-service.ts` |
| 디렉티브 | `Autofocus` | `autofocus.ts` |
| 파이프 | `FormatDate` | `format-date.ts` |
| 가드 | — | `auth-guard.ts` |
| 인터셉터 | — | `auth-interceptor.ts` |
| 모델 · 타입 | — | `task.ts` |

서비스 파일명의 `-service` 접미사는 타입 접미사가 아닌 서비스 클래스명(`*Service`)을 반영한 결과입니다. 클래스명이 변경되면 파일명도 동일하게 변경합니다.

단일 파일 내 복수 클래스 export를 금지하며, 1파일 1클래스 원칙을 적용하여 파일을 분할합니다.

가드 및 인터셉터 등 함수 기반 인프라는 식별성을 위해 `-guard.ts`, `-interceptor.ts` 접미사를 유지합니다.

### 2.1.1 라우트 진입 컴포넌트

`pages` 슬라이스의 라우트 진입 컴포넌트 파일명에는 `.page` 접미사(`.page.ts`, `.page.html`)를 적용하며, 클래스명은 `Page`로 끝냅니다.

`ui/` 세그먼트 내에서 일반 표현 컴포넌트와 라우터가 직접 인스턴스화하는 진입점 컴포넌트의 역할을 명확히 구분하기 위함입니다. `.page` 접미사는 FSD 아키텍처 상의 역할 식별자입니다.

| 대상 | 파일 (예시) | 클래스 (예시) | 선택자 (예시) |
| :--- | :--- | :--- | :--- |
| **라우트 진입** | `task-list.page.ts` | `TaskListPage` | `app-task-list` |
| **표현 컴포넌트** | `task-row.ts` | `TaskRow` | `app-task-row` |

페이지 컴포넌트의 선택자에는 `-page` 접미사를 붙이지 않습니다. 라우터에 의해 동적으로 인스턴스화되므로 템플릿 태그로 직접 참조되지 않습니다.

`app` 계층의 레이아웃 컴포넌트는 화면 골격이므로 `.page` 접미사 적용 대상에서 제외합니다.

### 2.2 도메인 기반 분할

세그먼트 내부의 파일을 분할할 때는 **다루는 도메인 관심사 단위**로 명명합니다. 기술적 역할을 포괄하는 모호한 파일명 생성을 **금지**합니다.

| 구분 | 준수 지침 (Do) | 금지 지침 (Don't) |
| :--- | :--- | :--- |
| **모델** | `model/task.ts` | `model/types.ts` |
| **유틸** | `lib/format-due-date.ts` | `lib/utils.ts` |
| **요청** | `api/fetch-tasks.ts` | `api/api.ts` |
| **상수** | `config/task-status.ts` | `config/constants.ts` |

`types.ts`, `utils.ts`, `api.ts`, `constants.ts` 등 포괄적 명칭의 사용을 금지합니다. 단일 파일 내 복수 관심사 혼재를 방지하고 응집도를 확보하기 위함입니다.

단일 세그먼트 내 도메인 관심사가 단 하나인 경우 슬라이스명과 동일한 파일명을 사용할 수 있습니다.

### 2.3 요청 함수 파일

HTTP API 요청 함수 파일은 수행하는 동작을 명시하는 **동사로 시작하는 케밥 케이스**로 명명합니다.

| 동작 | 파일명 (예시) |
| :--- | :--- |
| 목록 조회 | `fetch-tasks.ts` |
| 단건 조회 | `fetch-task.ts` |
| 생성 | `create-task.ts` |
| 수정 | `update-task.ts` |
| 삭제 | `delete-task.ts` |

## 3. 클래스명과 심볼명

### 3.1 클래스

클래스명은 **파스칼 케이스(PascalCase)**를 적용합니다.

| 대상 | 클래스명 (예시) | 접미사 규정 |
| :--- | :--- | :--- |
| 컴포넌트 | `TaskRow` | 없음 |
| 라우트 진입 컴포넌트 | `TaskListPage` | `Page` |
| 서비스 | `TaskService` | `Service` |
| 디렉티브 | `Autofocus` | 없음 |
| 파이프 | `FormatDate` | 없음 |

컴포넌트, 디렉티브, 파이프 클래스명에 Angular 타입 접미사(`Component`, `Directive`, `Pipe`)를 붙이지 않습니다.

서비스 클래스는 `Service` 접미사를 필수로 적용합니다. 주입 변수명 충돌을 방지하고 명명 일관성을 유지하기 위함입니다. `Store`, `Commands`, `Bus` 등의 임의 접미사 사용을 지양하고 `Service`로 통일합니다.

### 3.2 함수

함수명은 **카멜 케이스(camelCase)**를 적용하며, 함수의 성격과 역할에 따라 접두사 규격을 준수합니다.

| 대상 | 형식 | 예시 |
| :--- | :--- | :--- |
| 주입 헬퍼 | `inject` 접두사 | `injectViewportClass` |
| 조회 요청 | `fetch` 접두사 | `fetchTasks` |
| 변경 요청 | 동작 동사 | `completeTask` |
| 계산 | 계산 동사 | `formatDate` |
| 판정 | `is` · `has` · `can` 접두사 | `isExpired` |

### 3.3 타입

OpenAPI 명세로부터 생성된 서버 타입은 생성기가 정의한 명칭을 그대로 사용하며 수동 수정을 금지합니다.

직접 정의하는 TypeScript 인터페이스 및 타입 별칭은 파스칼 케이스를 적용하며, `I` 접두사나 `Type` 접미사를 붙이지 않습니다.

**템플릿 노출 식별자의 영문 명명 강제**: Angular 템플릿 파서의 `NG5002 Lexer Error` 발생을 방지하기 위해 템플릿 표현식 및 호스트 바인딩에 노출되는 모든 멤버(`public`, `protected`)는 영문 식별자만을 사용합니다. 한글 식별자는 템플릿에 노출되지 않는 `private` 멤버 및 지역 변수에 한해 제한적으로 허용합니다.

### 3.4 주입 변수명

주입(`inject()`) 결과를 직접 할당받는 멤버 변수는 대상 클래스명의 **로워 카멜 케이스(lowerCamelCase)**를 적용합니다.

```ts
private readonly taskService = inject(TaskService);
private readonly httpClient = inject(HttpClient);
private readonly router = inject(Router);
```

임의의 축약 명칭(예: `http`, `srv`) 사용을 금지합니다.

주입값을 가공·변환한 결과를 담는 변수는 해당 값의 의미를 나타내는 식별자로 명명합니다.

```ts
private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
```

클래스가 아닌 주입 토큰(InjectionToken)의 경우 토큰명의 로워 카멜 케이스를 적용합니다.

## 4. 선택자

컴포넌트 선택자(`selector`)는 `angular.json`의 `prefix` 설정(`app`)과 함께 **케밥 케이스 요소명**으로 선언합니다.

```ts
@Component({ selector: 'app-task-list' })
```

디렉티브 선택자는 접두사를 포함한 **카멜 케이스 속성 선택자(`[app...]`)** 형식을 적용합니다.

```ts
@Directive({ selector: '[appAutofocus]' })
```

외부 UI 킷(Spartan 등) 복사본 컴포넌트는 원본 라이브러리 접두사를 유지합니다. 세부 예외 기준은 [프론트엔드 01. 개발 환경](./01-dev-environment.md) 7절을 따릅니다.

## 5. 슬라이스명

### 5.1 형식

슬라이스명은 **케밥 케이스**를 적용하며, 계층별 목적에 따라 지정된 품사 형태를 준수합니다.

| 계층 | 품사 | 예시 |
| :--- | :--- | :--- |
| **`pages`** | 화면 단위를 나타내는 명사구 | `task-list` |
| **`features`** | 사용자 동작을 나타내는 동사구 | `file-upload` |
| **`entities`** | 도메인 비즈니스 개념을 나타내는 명사 | `task` |

슬라이스 명명 시 품사 형태는 계층 판정의 보조 기준으로 활용합니다 (동사구 형태는 `features`, 명사 형태는 `entities`).

### 5.2 pages 슬라이스명

`pages` 슬라이스명은 라우팅 경로(`URL path`)와 대응되도록 명명합니다.

| 라우트 | 슬라이스 (예시) |
| :--- | :--- |
| `/tasks` | `task-list` |
| `/tasks/:id` | `task-detail` |
| `/tasks/:id/edit` | `task-edit` |
| `/tasks/new` | `task-create` |

목록, 상세, 편집, 생성 화면은 각각 독립된 슬라이스로 분리합니다. 접미사를 `-list`, `-detail`, `-edit`, `-create`로 통일하여 화면의 역할을 명시합니다.

### 5.3 금지

| 금지 항목 | 사유 |
| :--- | :--- |
| 슬라이스명에 계층명 포함 | 디렉터리 경로에 이미 계층명이 명시되어 중복임 |
| 포괄적인 명칭(`common` · `misc` · `management`) 사용 | 응집도가 저하되고 책임 경계가 모호해짐 |
| 축약어 사용 | 검색성이 저하되고 의미 전달이 불명확해짐 |
| `shared` 세그먼트명과 중복되는 슬라이스 그룹명 | Steiger `ambiguous-slice-names` 규칙에 의해 빌드 차단됨 |

포괄적인 명칭의 사용을 금지하며, 명확한 책임 단위로 슬라이스를 분할합니다.

## 6. 상수와 열거값

상수는 **대문자 스네이크 케이스(SCREAMING_SNAKE_CASE)**를 적용합니다.

```ts
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
```

열거형 상수는 `enum` 대신 `as const` 객체와 유니온(Union) 타입을 조합하여 정의합니다 (`isolatedModules` 호환성 확보 및 불필요한 런타임 코드 생성 방지).

```ts
export const TASK_STATUS = {
  todo: 'TODO',
  doing: 'DOING',
  done: 'DONE',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
```

## 7. 클래스 멤버 순서

클래스 본문은 아래 8개 블록의 순서로 배치합니다. 각 블록 앞에 구분선 주석을 배치하고 블록 사이는 빈 줄로 구분합니다.

| 순서 | 블록 | 대상 |
| :--- | :--- | :--- |
| 1 | 상수 | `static` 값, 템플릿에 재노출하는 외부 심볼, 불변 스칼라 |
| 2 | 계약 | `input` · `model` · `output` |
| 3 | 의존 | `inject` |
| 4 | 질의 | `viewChild` · `contentChild` |
| 5 | 상태 | `signal` · `linkedSignal` · `form` |
| 6 | 파생 | `computed` · `resource` · `httpResource` |
| 7 | 생성 | 생성자 · 라이프사이클 훅 |
| 8 | 동작 | 템플릿 및 외부에 노출되는 메서드(앞), `private` 메서드(뒤) |

구분선 주석은 `// --- <블록명> ` 뒤에 대시(`-`)를 채워 들여쓰기를 포함한 총 **100 컬럼**으로 작성합니다 (한글 2컬럼 계산, `.prettierrc`의 `printWidth: 100` 기준).

해당하는 멤버가 없는 블록은 구분선 주석을 포함하여 생략합니다. 서비스 클래스는 대개 계약, 질의, 생성 블록을 생략합니다. 블록 내부의 정렬 순서는 별도로 강제하지 않으며 연관된 멤버를 인접 배치합니다.

**템플릿 노출 상수의 필드 참조**: 템플릿 바인딩을 위해 클래스 필드로 재노출한 상수는 클래스 내부에서도 해당 필드(`this.<상수>`)로 일관되게 참조합니다. 템플릿에서 사용하지 않는 상수는 클래스 필드로 선언하지 않고 모듈 스코프 상수를 직접 참조합니다.

**단일 블록 선언**: 동일한 블록은 클래스 내에 한 번만 선언하며, 앞선 블록의 멤버를 후속 블록 뒤에 다시 추가하는 것을 금지합니다.

**배치 원칙**:
1. **참조 방향 일치**: 상위 블록에 정의된 심볼을 하위 블록에서 참조하도록 배치하여 위에서 아래로 읽는 순서와 의존 방향을 일치시킵니다.
2. **가시성(Visibility) 순서**: 외부 공개 계약을 최상단에 두고, 비공개 내부 구현(`private`)을 최하단에 배치합니다.

```ts
export class TaskListPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;

  // --- 계약 --------------------------------------------------------------------------------------
  readonly view = input<TaskView, string | undefined>('all', { transform: toTaskView });

  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  // --- 질의 --------------------------------------------------------------------------------------
  protected readonly veil = viewChild.required(Veil);

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly draft = signal({ title: '' });

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly title = computed(() => taskViewLabel(this.view()));

  // --- 동작 --------------------------------------------------------------------------------------
  protected addOnEnter(event: KeyboardEvent): void {}
  private async add(): Promise<void> {}
}
```

기능 단위가 아닌 기술적 역할 블록 순서로 배치함에 따라 단일 기능의 상태·파생·동작이 분산될 수 있습니다. 멤버 간 분산으로 인한 복잡도가 증가하는 경우 컴포넌트를 더 작은 단위로 분할하여 해결합니다.

외부 UI 킷(Spartan 등) 복사본 코드는 상류 코드 동기화를 위해 본 배치 규칙의 적용 대상에서 제외합니다.

## 8. 강제 수단 및 검증 방식

| 규칙 | 검증 주체 및 강제 수단 |
| :--- | :--- |
| 선택자 접두사 및 형식 | ESLint (`@angular-eslint`) 자동 차단 |
| 클래스 타입 접미사 생략 | ESLint (`@angular-eslint`) 자동 차단 |
| 파일명 케밥 케이스 | ESLint 파일명 규칙 자동 차단 |
| FSD 슬라이스 및 세그먼트 명명 | Steiger (`inconsistent-naming`, `ambiguous-slice-names`, `segments-by-purpose`) 자동 차단 |
| 라우트 진입 컴포넌트 `.page` 접미사 | 코드 리뷰 검증 (자동 린트 미지원) |
| 단일 파일 내 단일 도메인 응집 여부 | 코드 리뷰 검증 (Linter 분석 한계) |
| 클래스 멤버 배치 순서 준수 여부 | 코드 리뷰 검증 (ESLint `member-ordering`의 시그널/인젝션 식별 한계) |

Steiger 명명 규칙은 슬라이스와 세그먼트 수준의 위반을 검출하며, 단일 파일 내 복수 도메인 혼재 여부는 코드 리뷰 단계에서 검증합니다.

라우트 진입 컴포넌트의 `.page` 접미사와 클래스 멤버 배치 순서는 정적 린트 도구로 자동 차단되지 않으므로 코드 리뷰 시 준수 여부를 확인합니다.
