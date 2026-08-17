# 05. 렌더링 전략

본 문서는 경로별 렌더링 모드의 결정 기준과, 서버와 브라우저에서 각각 실행되는 코드를 구분하는 규칙을 정의합니다.

이 문서가 [06. 레이아웃](06-layout.md)과 [07. 적응형 UI](07-adaptive-ui.md)보다 앞서는 이유는, 경로의 렌더링 모드가 정해져야 그 경로에서 적응형 컴포넌트를 쓸 수 있는지 판정되기 때문입니다.

## 1. 경로별 렌더링 모드

| 경로 | 모드 | 적용 대상 |
| :--- | :--- | :--- |
| **공개 경로** | `RenderMode.Prerender` | 랜딩, 로그인, 약관, 오류 안내 등 사용자별 데이터가 없는 화면 |
| **그 외 전체** | `RenderMode.Client` | 인증이 필요한 모든 업무 화면 |

```ts
// app/app.routes.server.ts
export const serverRoutes: ServerRoute[] = [
  { path: '',      renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'terms', renderMode: RenderMode.Prerender },
  { path: '**',    renderMode: RenderMode.Client },
];
```

정적 생성 대상은 **명시적으로 열거한 경로만** 받습니다. `**` 를 `Client` 로 두어 새 라우트가 자동으로 안전한 쪽에 떨어지게 합니다.

`RenderMode.Server` 를 사용하지 않습니다. 요청 시 서버 렌더링이 값을 가지려면 서버가 인증 상태를 알아야 하고, 이는 토큰을 httpOnly 쿠키로 강제해 백엔드 인증 방식을 규정하게 됩니다. 본 표준은 백엔드 방식을 강제하지 않습니다.

파라미터가 있는 경로를 정적 생성하려면 `getPrerenderParams` 로 생성할 값 목록을 제공해야 합니다. 그 목록이 빌드 시점에 확정되지 않으면 정적 생성 대상이 아닙니다.

> **중요: SSR 서버를 실제로 띄우려면 `allowedHosts` 를 설정해야 합니다**
>
> `angular.json` 의 `security.allowedHosts` 가 빈 배열이면 모든 요청이 400 으로 거부됩니다. 정적 생성만 확인하면 드러나지 않고 서버를 띄울 때 전부 막힙니다.

## 2. 실행 환경 구분

정적 생성 경로의 컴포넌트가 임포트하는 코드는 **빌드 시점에 Node 환경에서 실행됩니다.** `pages` 에 두었더라도 그것이 임포트하는 `shared` 코드까지 함께 실행됩니다.

### 2.1 shared 의 제약

`shared` 의 코드는 모듈 최상위에서 브라우저 API 를 호출하는 것을 **금지**합니다.

```ts
// 금지 — 모듈 로드 시점에 실행되어 서버에서 실패합니다
const stored = localStorage.getItem('theme');

// 허용 — 호출 시점에 평가되며 호출자가 환경을 보장합니다
export function readStoredTheme(): string | null {
  return localStorage.getItem('theme');
}
```

브라우저에서만 유효한 초기화가 필요하면 `afterNextRender` 또는 `isPlatformBrowser` 로 감쌉니다.

| API | 사용 상황 |
| :--- | :--- |
| `afterNextRender` | DOM 이 준비된 뒤 한 번 실행할 초기화 |
| `afterEveryRender` | 렌더링마다 필요한 DOM 측정 |
| `isPlatformBrowser(inject(PLATFORM_ID))` | 분기 자체가 필요한 경우 |

`typeof window !== 'undefined'` 형태의 검사를 **금지**합니다. Angular 가 제공하는 플랫폼 판별을 사용해야 테스트에서 환경을 주입할 수 있습니다.

**`afterNextRender` 안에서 화면 구성을 바꾸지 않습니다.** 정적 생성 시점에는 실행되지 않으므로 그 결과가 생성된 HTML 에 빠지고 하이드레이션 이후에야 나타납니다. 고정된 자리에 요소가 뒤늦게 끼어드는 형태로 드러나며, 개발 서버에서는 부팅이 빨라 알아채기 어렵습니다.

### 2.2 서버에서 사용할 수 없는 것

| 대상 | 서버 동작 |
| :--- | :--- |
| `window`, `document`, `navigator` | 존재하지 않습니다 |
| `localStorage`, `sessionStorage` | 존재하지 않습니다 |
| `matchMedia` | 존재하지 않습니다 |
| 타이머 (`setInterval`) | 실행되지만 정리되지 않으면 빌드가 종료되지 않습니다 |

## 3. 하이드레이션

### 3.1 설정

```ts
// app/app.config.ts
providers: [provideClientHydration(withEventReplay())]
```

증분 하이드레이션은 Angular 22 에서 **기본 활성화**되어 있습니다. `withIncrementalHydration()` 은 v22 부터 폐기 예정 표시가 붙었으므로 명시하지 않습니다. 끄려면 `withNoIncrementalHydration()` 을 사용합니다.

`withEventReplay()` 는 옵트인이므로 명시적으로 추가합니다. 하이드레이션이 완료되기 전에 사용자가 누른 클릭을 보관했다가 완료 후 재생하므로, 정적 생성된 공개 페이지에서 첫 클릭이 유실되는 것을 막습니다.

### 3.2 불일치 방지

서버가 만든 DOM 과 클라이언트가 만들 DOM 이 다르면 하이드레이션이 실패하고 해당 영역이 통째로 다시 그려집니다.

| 금지 | 사유 |
| :--- | :--- |
| 정적 생성 경로에서 난수·현재 시각으로 DOM 결정 | 서버와 클라이언트의 값이 다릅니다 |
| 정적 생성 경로에서 적응형 컴포넌트 사용 | 서버에는 포인터와 뷰포트가 없습니다 |
| 정적 생성 경로에서 `localStorage` 값으로 초기 표시 결정 | 서버에서 읽을 수 없습니다 |
| Angular 외부에서 DOM 직접 조작 | 하이드레이션이 노드 구조를 신뢰할 수 없게 됩니다 |

> **주의: 정적 생성 경로에서는 적응형 컴포넌트를 사용하지 않습니다**
>
> 서버에는 포인터 정밀도와 호버 가능 여부를 판정할 수단이 없어 `injectInteractionMode()` 가 기본값을 반환합니다. 빌드 시 생성된 HTML 과 클라이언트 판정이 어긋나면 화면이 한 번 깜빡이며 다시 그려집니다. 공개 경로에는 CSS 미디어 쿼리로 해결되는 반응형만 사용합니다. **이 위반은 예외로 드러나지 않으므로** 코드 리뷰에서 확인합니다. 상세는 [07. 적응형 UI](07-adaptive-ui.md)에 있습니다.

### 3.3 증분 하이드레이션

무거운 영역은 `@defer` 의 `hydrate` 트리거로 하이드레이션 시점을 늦춥니다.

```html
@defer (hydrate on viewport) {
  <app-task-chart [data]="data()" />
}
```

정적 생성 경로에서만 의미가 있습니다. 클라이언트 렌더링 경로에는 하이드레이션할 서버 HTML 이 없으므로 `@defer` 의 일반 트리거만 동작합니다.

적용 대상은 **측정으로 확인한 뒤** 정합니다. 추측으로 넣으면 첫 상호작용 지연만 늘어납니다.

## 4. 전송 상태

정적 생성 경로에서 `HttpClient` 로 조회한 데이터는 HTML 에 실려 클라이언트로 전달되며 클라이언트는 같은 요청을 다시 보내지 않습니다. `provideClientHydration()` 이 이 동작을 기본 포함합니다.

`httpResource` 도 `HttpClient` 위에서 동작하므로 같은 혜택을 받습니다. 별도 배선이 필요 없습니다.

끄려면 `withNoHttpTransferCache()` 를 사용합니다. 응답에 사용자별 민감정보가 포함되면 HTML 에 그대로 실리므로 확인이 필요하나, 본 표준은 정적 생성 경로에 인증 데이터를 두지 않으므로 해당하지 않습니다.

## 5. 빌드와 실행

| 명령 | 결과 |
| :--- | :--- |
| `ng build` | 정적 생성 경로의 HTML 을 빌드 시점에 생성합니다 |
| `npm run serve:ssr:<프로젝트명>` | 생성된 서버 번들을 실행합니다 |

`src/server.ts` 는 Express 진입점이며 FSD 계층에 속하지 않습니다. 이 파일에 업무 로직을 넣는 것을 **금지**합니다. 정적 파일 서빙과 Angular 렌더링 위임 외의 역할을 부여하면 프론트엔드 저장소가 백엔드 책임을 갖게 됩니다.

## 6. 프로토타입 구간의 적용

[프로세스](../../../../docs/process.md)의 2단계에서는 데이터가 Mock 구현 뒤에 있습니다. Mock 은 브라우저와 Node 양쪽에서 동작하므로 렌더링 모드 선택에 제약을 주지 않습니다.

다만 **인증이 붙는 화면을 미리 `Client` 로 잡아 둡니다.** 프로토타입에서 `Prerender` 로 만들어 둔 화면에 나중에 인증을 붙이면 정적 생성 대상 목록과 적응형 컴포넌트 사용 여부를 함께 되돌려야 합니다.
