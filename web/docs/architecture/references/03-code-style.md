# 03. 코드 작성 규약

본 문서는 파일명, 클래스명, 선택자, 슬라이스명의 명명 규약과 클래스 본문의 멤버 배치 순서를 정의합니다.

명명은 두 규약을 결합합니다. **파일과 클래스는 Angular 스타일 가이드를 따르고, 세그먼트 내부의 파일 분할은 FSD 의 도메인 기반 명명을 따릅니다.**

배치 규약은 컴포넌트(`@Component`)와 서비스(`@Injectable`)에 공통 적용됩니다. 슬라이스 내부의 컴포넌트 분할 기준은 [11. 컴포넌트 설계](11-component-design.md)가 원본입니다.

## 1. 기준판 고정

Angular 스타일 가이드는 **2025년 개정판**을 기준으로 합니다.

이 개정에서 파일명의 타입 접미사(`.component.ts`, `.service.ts`, `.directive.ts`)가 제거되었습니다. Angular CLI 의 `fileNameStyleGuide` 옵션 값 `2025` 에 해당하며, `ng new` 가 생성하는 루트 컴포넌트가 `app.component.ts` 가 아니라 `app.ts` 인 것이 이 규약의 적용 결과입니다.

기준판을 고정하지 않으면 CLI 생성물과 문서 규약이 불일치하여 생성 시마다 파일명을 수동으로 수정해야 합니다.

## 2. 파일명

### 2.1 형식

모든 파일명은 **케밥 케이스**를 사용합니다. **파일이 클래스를 내보내면 파일명은 그 클래스명을 그대로 옮긴 것이어야 합니다.**

> "File names should generally describe the contents of the code in the file. When the file contains a TypeScript class, the file name should reflect that class name." — [Angular 스타일 가이드](https://angular.dev/style-guide)

| 대상 | 클래스 | 파일명 |
| :--- | :--- | :--- |
| 컴포넌트 | `TaskRow` | `task-row.ts`, `task-row.html` |
| 라우트 진입 컴포넌트 | `TaskListPage` | `task-list.page.ts`, `task-list.page.html` |
| 서비스 | `SessionService` | `session-service.ts` |
| 디렉티브 | `Autofocus` | `autofocus.ts` |
| 파이프 | `FormatDate` | `format-date.ts` |
| 가드 | — | `auth-guard.ts` |
| 인터셉터 | — | `auth-interceptor.ts` |
| 모델·타입 | — | `task.ts` |

서비스 파일이 `-service` 로 끝나는 것은 타입 접미사를 되살린 것이 아닙니다. 3.1절이 서비스 클래스에 `Service` 를 붙이므로 파일명이 클래스명을 따라간 결과입니다. **클래스명이 바뀌면 파일명도 함께 바뀝니다.**

**한 파일이 클래스 둘을 내보내면 파일을 나눕니다.** 파일명이 어느 한쪽만 가리키게 되어 나머지 하나를 이름으로 찾을 수 없습니다.

가드와 인터셉터는 클래스가 아니라 함수이므로 접미사를 유지합니다. 이름만으로 역할이 드러나지 않으면 라우트 정의나 프로바이더 배열에서 무엇인지 판별할 수 없습니다.

### 2.1.1 라우트 진입 컴포넌트

**`pages` 슬라이스의 라우트 진입 컴포넌트는 `.page` 접미사를 갖습니다.** 클래스명도 `Page` 로 끝냅니다.

`ui/` 세그먼트는 평면으로 유지하므로 화면이 커지면 표현 컴포넌트가 같은 자리에 나란히 쌓입니다. 그때 어느 것이 라우터가 여는 진입점인지 파일 목록만으로는 판별되지 않습니다. 슬라이스명과 같은 이름이라는 관례에 기대면 `task-list.ts` 와 `task-list-row.ts` 가 나란히 정렬되어 구분이 사라집니다.

`.page` 는 Angular 타입을 되풀이하는 접미사가 아니라 **FSD 에서의 역할 표시**이므로 1절의 기준판과 충돌하지 않습니다. 가드와 인터셉터에 접미사를 남긴 것과 같은 근거입니다.

| 대상 | 파일 | 클래스 | 선택자 |
| :--- | :--- | :--- | :--- |
| **라우트 진입** | `task-list.page.ts` | `TaskListPage` | `app-task-list` |
| **표현 컴포넌트** | `task-row.ts` | `TaskRow` | `app-task-row` |

선택자에는 `-page` 를 붙이지 않습니다. 페이지 컴포넌트의 선택자는 템플릿에 나타나지 않으며 라우터가 인스턴스화합니다.

`app` 계층의 레이아웃은 대상이 아닙니다. 라우트가 여는 화면이 아니라 화면을 담는 골격입니다.

**이 규칙에는 자동 강제 수단이 없습니다.** ESLint 에 파일명 패턴 규칙이 없고 Steiger 는 접미사를 보지 않으므로 코드 리뷰에서 확인합니다.

### 2.2 도메인 기반 분할

세그먼트 안에서 파일을 나눌 때는 **다루는 도메인**으로 이름 짓습니다. 기술적 역할로 짓는 것을 **금지**합니다.

| 구분 | 준수 지침 (Do) | 금지 지침 (Don't) |
| :--- | :--- | :--- |
| **모델** | `model/task.ts` | `model/types.ts` |
| **유틸** | `lib/format-due-date.ts` | `lib/utils.ts` |
| **요청** | `api/fetch-tasks.ts` | `api/api.ts` |
| **상수** | `config/task-status.ts` | `config/constants.ts` |

`types.ts` 와 `utils.ts` 를 금지합니다. 서로 다른 도메인 관심사가 한 파일에 섞입니다. 파일명만으로 내용을 파악할 수 없고, 불명확한 역할로 인해 응집도가 낮은 코드가 누적되는 원인이 됩니다.

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

**파스칼 케이스**를 사용합니다. 접미사는 대상에 따라 다릅니다.

| 대상 | 클래스명 | 접미사 |
| :--- | :--- | :--- |
| 컴포넌트 | `TaskRow` | 없음 |
| 라우트 진입 컴포넌트 | `TaskListPage` | `Page` |
| 서비스 | `TaskService` | `Service` |
| 디렉티브 | `Autofocus` | 없음 |
| 파이프 | `FormatDate` | 없음 |

컴포넌트는 `TaskRowComponent` 가 아니라 `TaskRow` 입니다. 접미사가 정보를 더하지 않으며 파일 위치(`ui/` 세그먼트)가 이미 역할을 드러냅니다. 라우트 진입 컴포넌트만 `Page` 로 끝내며, 이것은 Angular 타입이 아니라 역할입니다. 근거는 2.1.1절에 있습니다.

**서비스는 예외로 `Service` 로 끝냅니다.** 근거는 역할 표시가 아니라 3.4절의 주입 변수명입니다. 클래스명이 `Tasks` 이면 주입 변수가 `tasks` 가 되어 목록을 담은 지역 변수와 충돌하지만, `TaskService` 이면 `taskService` 로 일의적입니다. `Store` · `Commands` · `Bus` 처럼 역할을 담는 이름을 쓰면 같은 성격의 클래스가 서로 다른 접미사를 갖게 되어 주입 변수명도 함께 갈라집니다.

### 3.2 함수

| 대상 | 형식 | 예시 |
| :--- | :--- | :--- |
| 주입 헬퍼 | `inject` 접두사 | `injectViewportClass`, `injectTask` |
| 조회 요청 | `fetch` 접두사 | `fetchTasks` |
| 변경 요청 | 동사 | `completeTask`, `deleteTask` |
| 계산 | 동사 | `calculateProgress`, `formatDate` |
| 판정 | `is` · `has` · `can` 접두사 | `isExpired`, `hasPermission` |

### 3.3 타입

생성된 서버 타입은 생성기가 정의한 이름을 그대로 사용하며 수동으로 수정하지 않습니다. 서버 어휘가 화면 코드에 드러나는 것은 [14. API 계약 소비](14-api-contract.md) 2.1절에서 감수하기로 한 대가입니다.

직접 정의하는 타입은 파스칼 케이스를 사용하며 `I` 접두사나 `Type` 접미사를 붙이지 않습니다.

> **주의: 템플릿에 노출되는 식별자에 한글을 쓸 수 없습니다**
>
> Angular 템플릿 표현식 파서가 한글 식별자를 `NG5002 Lexer Error` 로 거부합니다. TypeScript 자체는 허용하므로 작성 시점에는 드러나지 않고 컴파일 단계에서야 실패합니다. 템플릿과 호스트 바인딩에 노출되는 멤버는 `protected` 를 포함해 영문으로 쓰고, 한글은 노출되지 않는 지역 변수와 `private` 멤버에만 씁니다.

### 3.4 주입 변수명

**주입 결과를 그대로 담는 필드는 클래스명의 로워 카멜 케이스를 씁니다.**

```ts
private readonly taskService = inject(TaskService);
private readonly httpClient = inject(HttpClient);
private readonly router = inject(Router);
```

축약하지 않습니다. `inject(HttpClient)` 를 `http` 에 담으면 같은 타입이 파일마다 다른 이름으로 나타나 검색과 대조가 어려워집니다.

주입값을 그대로 담지 않고 **변환한 결과**는 그 값의 의미로 이름 짓습니다.

```ts
private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
```

주입 토큰이 클래스가 아닌 경우(`DOCUMENT`, `PLATFORM_ID`)는 토큰명의 로워 카멜 케이스를 씁니다.

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
| 지나치게 포괄적인 슬라이스명 (`common`, `misc`, `management`) | 응집도가 낮아지고 책임 경계가 모호해집니다 |
| 축약어 (`tsk`, `usr`) | 코드 검색성이 떨어지고 가독성과 의미 전달이 저해됩니다 |
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

## 7. 클래스 멤버 순서

클래스 본문은 아래 여덟 블록의 순서로 배치합니다. 각 블록 앞에 구분선 주석을 두고, 블록 사이는 빈 줄로 구분합니다.

| 순서 | 블록 | 대상 |
| :--- | :--- | :--- |
| 1 | 상수 | `static` 값, 템플릿에 재노출하는 외부 심볼, 불변 스칼라 |
| 2 | 계약 | `input` · `model` · `output` |
| 3 | 의존 | `inject` |
| 4 | 질의 | `viewChild` · `contentChild` |
| 5 | 상태 | `signal` · `linkedSignal` · `form` |
| 6 | 파생 | `computed` · `resource` · `httpResource` |
| 7 | 생성 | 생성자 · 라이프사이클 훅 |
| 8 | 동작 | 템플릿과 외부가 호출하는 메서드를 앞에, `private` 메서드를 뒤에 |

구분선은 `// --- ` 뒤에 블록명을 두고 대시로 **100 컬럼**까지 채웁니다. 들여쓰기를 포함한 폭이며 한글은 두 컬럼으로 셉니다. 100 은 `.prettierrc` 의 `printWidth` 와 같은 값입니다. 블록명을 앞에 두는 이유는 이름이 항상 같은 열에 서서 세로로 훑을 때 눈에 걸리기 때문입니다.

```ts
  // --- 상수 --------------------------------------------------------------------------------------
  // --- 계약 --------------------------------------------------------------------------------------
```

해당하는 멤버가 없는 블록은 주석과 함께 생략합니다. 서비스는 대개 계약 · 질의 · 생성 블록을 갖지 않습니다.

블록 내부의 정렬은 정의하지 않습니다. 연관된 멤버를 인접 배치하는 것으로 충분합니다.

**템플릿에 재노출한 상수는 클래스 안에서도 필드로 씁니다.** Angular 템플릿은 모듈 스코프 심볼에 접근하지 못하므로 상수를 필드로 한 번 얹게 되는데, 이때 코드가 원본 상수를 직접 참조하면 한 파일에 같은 값이 두 이름으로 존재하게 됩니다.

```ts
protected readonly routes = ROUTES;

async submit(): Promise<void> {
  await this.router.navigateByUrl(this.routes.taskList());   // ROUTES.taskList() 가 아닙니다
}
```

템플릿이 쓰지 않는 상수는 필드로 얹지 않고 모듈 스코프에서 직접 참조합니다. 필드는 재노출이 필요할 때만 만듭니다.

**한 블록은 파일당 한 번만 등장합니다.** 뒤쪽에서 앞 블록으로 되돌아가 멤버를 추가하는 것을 금지합니다.

**참조 방향이 곧 읽는 방향입니다.** 파생은 상태를, 상태는 의존을 참조하므로 참조 대상이 항상 위에 위치합니다. 위에서 아래로 한 번 읽는 동안 미정의 심볼을 만나지 않습니다.

**공개 범위가 넓은 것이 위에 옵니다.** 외부가 보는 계약이 최상단, 외부가 볼 수 없는 `private` 메서드가 최하단입니다.

```ts
export class TaskListPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  private readonly today = toDateKey(new Date());

  // --- 계약 --------------------------------------------------------------------------------------
  readonly view = input<TaskView, string | undefined>('all', { transform: toTaskView });
  readonly task = input<string | undefined>(undefined);

  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  // --- 질의 --------------------------------------------------------------------------------------
  protected readonly veil = viewChild.required(Veil);

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly draft = signal({ title: '' });
  protected readonly addForm = form(this.draft);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly groups = computed(() => sortActive(this.taskService.list()));
  protected readonly title = computed(() => taskViewLabel(this.view()));

  // --- 동작 --------------------------------------------------------------------------------------
  protected addOnEnter(event: KeyboardEvent): void {}
  private async add(): Promise<void> {}
}
```

이 배치는 연관된 멤버를 분산시킵니다. `draftDue`(상태) · `draftDueDate`(파생) · `setDraftDue`(동작)가 세 블록에 나뉩니다. 기능 단위로 묶는 대안은 "기능의 경계"라는 판단을 추가로 요구하여 배치 기준이 파편화되므로 채택하지 않습니다. 분산의 부담이 큰 경우 원인은 순서가 아니라 컴포넌트 크기이며, [11. 컴포넌트 설계](11-component-design.md) 2절의 분할 기준을 적용합니다.

외부 UI 킷의 사본(`shared/ui`)은 상류와의 차이를 최소화하기 위해 본 절의 적용 대상에서 제외합니다.

## 8. 자동 강제

| 규칙 | 강제 수단 |
| :--- | :--- |
| 선택자 접두사와 형식 | `angular-eslint` 규칙 |
| 클래스 접미사 금지 | `angular-eslint` 규칙 |
| 도메인 기반 파일명 | Steiger `inconsistent-naming`, `ambiguous-slice-names`, `segments-by-purpose` (부분) |
| 파일명 케밥 케이스 | ESLint 파일명 규칙 |

Steiger 의 명명 규칙은 슬라이스와 세그먼트 수준의 위반만 검출합니다. **파일 하나가 여러 도메인을 담고 있는지는 판정하지 못하므로** 코드 리뷰에서 확인합니다.

**라우트 진입 컴포넌트의 `.page` 접미사도 강제되지 않습니다.** ESLint 에 파일명 패턴 규칙이 없고 Steiger 는 접미사를 보지 않습니다. 규칙을 어겨도 빌드가 통과하므로 같은 자리에서 확인합니다.

**클래스 멤버 순서도 강제되지 않습니다.** ESLint 의 `member-ordering` 은 필드 초기화 식을 구분하지 못하여 `input()` · `inject()` · `signal()` 을 모두 동일한 필드로 판정하므로 본 규칙을 검사할 수 없습니다. 같은 자리에서 확인합니다.
