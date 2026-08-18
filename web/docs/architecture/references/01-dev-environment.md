# 01. 개발 환경

본 문서는 프로젝트 구성 파일의 역할과 실행 명령을 정의합니다. 각 규칙의 근거는 해당 참조 문서가 원본이며, 본 문서는 **그 규칙이 어디에서 강제되는지**를 연결합니다.

## 1. 구성 파일

| 파일 | 역할 | 규칙의 원본 |
| :--- | :--- | :--- |
| `package.json` | 의존성과 버전 | 본 문서에 버전을 중복 기재하지 않습니다 |
| `tsconfig.json` | 컴파일러 옵션, 경로 별칭 | [02. 패키지 배치](02-package-structure.md) 7.3절 |
| `angular.json` | 빌드 설정, 번들 예산, 전역 스타일 | [18. 성능](18-performance.md) 1절 |
| `steiger.config.ts` | FSD 계층 규칙 강제 | [02. 패키지 배치](02-package-structure.md) 9절 |
| `eslint.config.js` | 코드 규약, 전역 프로바이더 위치 제한, 임포트 제한, 템플릿 접근성 | [02. 패키지 배치](02-package-structure.md) 7.5절, [16. 보안](16-security.md) 3절, [12. 폼과 검증](12-forms.md) 1절 |
| `.postcssrc.json` | Tailwind 플러그인 등록 | [04. 디자인 시스템](04-design-system.md) |
| `.gitattributes` | 줄바꿈 정책, 바이너리 지정 | 본 문서 3절 |

**설정값을 문서에 옮겨 적지 않습니다.** 두 벌이 되면 한쪽이 낡습니다. 문서는 규칙과 근거를 담고, 설정 파일이 그 규칙의 실행 형태를 담습니다.

## 2. 경로 별칭

```json
// tsconfig.json
{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

`baseUrl` 을 지정하는 것을 **금지**합니다. TypeScript 6에서 폐기 예정으로 표시되어 지정하면 `TS5101` 오류로 빌드가 실패합니다. `paths` 만 정의하고 값을 `"./src/*"` 형태의 상대 경로로 씁니다.

계층 간 임포트에 상대 경로를 쓰는 것은 ESLint `no-restricted-imports` 가 차단합니다. Steiger 는 상대 경로로 작성된 위반도 검출하므로 별칭 규칙의 근거는 검출 가능성이 아니라 **파일 이동 내성**입니다. 슬라이스를 다른 계층으로 옮길 때 상대 경로는 전부 깨지지만 별칭은 유지됩니다.

## 3. 줄바꿈 정책

모든 텍스트 파일은 저장소와 체크아웃 양쪽에서 **LF** 를 사용합니다. `.gitattributes` 의 `* text=auto eol=lf` 선언이 개인의 `core.autocrlf` 설정보다 우선합니다.

선언하지 않으면 Windows 환경에서 체크아웃 시 CRLF 로 변환되어 커밋마다 잡음이 생기고, 협업 시 줄바꿈만 다른 차이가 발생합니다.

| 대상 | 처리 |
| :--- | :--- |
| 텍스트 전반 | LF |
| `*.bat`, `*.cmd` | CRLF. `cmd` 가 CRLF 를 기대합니다 |
| 이미지·폰트·문서 바이너리 | 변환 금지 |
| `package-lock.json` | `linguist-generated=true`. 사람이 리뷰하지 않습니다 |

> **주의: OpenAPI 생성 타입은 `linguist-generated` 로 표시하지 않습니다**
>
> 생성물을 커밋하는 이유가 **계약 변경이 PR 차이에 드러나는 것**이기 때문입니다([14. API 계약 소비](14-api-contract.md) 1.1절). 차이 표시를 접으면 필드가 사라진 것을 병합 전에 발견할 수 없게 되어 그 이유가 무효화됩니다.

## 4. 디렉터리 골격

```text
web/
├── docs/
├── src/
│   ├── app/
│   ├── pages/
│   ├── shared/
│   ├── main.ts
│   ├── main.server.ts
│   ├── server.ts
│   └── index.html
├── angular.json
├── tsconfig.json
├── eslint.config.js
└── steiger.config.ts
```

`app` 은 FSD app 계층이자 Angular 루트이며 전역 스타일을 포함합니다. `pages` 는 라우트 단위 화면, `shared` 는 비즈니스 로직이 없는 인프라입니다. 나머지 네 파일은 프레임워크 진입점이며 계층 밖입니다.

`features` 와 `entities` 는 재사용이 확인된 시점에 생성합니다. 빈 폴더를 미리 만들지 않습니다.

전역 스타일은 `src/app/styles.css` 이며 `angular.json` 의 `styles` 항목이 이 경로를 가리킵니다. Angular CLI 기본값인 `src/styles.css` 에서 이동한 것으로, FSD 가 전역 스타일을 `app` 계층에 두도록 정하고 있기 때문입니다.

> **중요: `src/styles.css` 를 남겨 두지 않습니다**
>
> Spartan CLI 의 스타일 진입점 자동 탐지는 `angular.json` 을 먼저 보지 않습니다. `<sourceRoot>/styles.{css,scss,sass,less}` 가 존재하면 그 파일을 쓰고 **없을 때만** `angular.json` 의 `build.options.styles` 로 넘어갑니다. `src/styles.css` 가 남아 있으면 `angular.json` 이 가리키지 않는 파일에 테마가 기록되며 오류 없이 진행됩니다. 생성기를 실행할 때 `--stylesEntryPoint=src/app/styles.css` 를 명시하면 탐지 순서와 무관하게 고정됩니다.

## 5. 명령

| 명령 | 용도 |
| :--- | :--- |
| `npm start` | 개발 서버 |
| `npm run build` | 운영 빌드. 번들 예산 초과 시 실패합니다 |
| `npm test` | 단위·컴포넌트 테스트 |
| `npm run lint` | 코드 규약 검사 |
| `npm run lint:fsd` | FSD 계층 규칙 검사 |
| `npm run check` | 위 셋을 순서대로 실행 |

`npm run check` 를 통과하지 않은 상태로 병합하지 않습니다. CI 는 이 명령 하나만 실행하면 됩니다.

## 6. 강제 수단의 적용 범위

문서에 적힌 규칙이 전부 자동으로 차단되지는 않습니다. **강제되지 않는 규칙은 그 사실을 문서에 함께 적습니다.** 강제된다고 오해하면 아무도 확인하지 않게 됩니다.

| 자동 차단 | 코드 리뷰에서 확인 |
| :--- | :--- |
| 계층 임포트 방향 | `shared` 의 비즈니스 로직 금지 |
| 공개 API 경유 | 적응형 컴포넌트의 두 모드 테스트 존재 |
| 동일 계층 크로스임포트 | 정적 생성 경로의 적응형 컴포넌트 금지 |
| 조기 추출 (`insignificant-slice`) | 파일 하나가 여러 도메인을 담는지 |
| 번들 예산 초과 | 토큰 없이 임의값을 쓰는지 |
| 전역 프로바이더 위치 | 시각 언어가 아키텍처 문서로 새어 드는지 |

## 7. 실측으로 확인한 사항

선행 저장소에서 실제로 검증한 항목입니다. 본 저장소에 그대로 적용되며, 재확인 없이 규칙의 근거로 씁니다.

| 항목 | 결과 |
| :--- | :--- |
| Steiger 가 경로 별칭을 인식하는가 | 인식합니다. `@/pages/...` 임포트를 계층으로 해석합니다 |
| Steiger 가 위반을 실제로 잡는가 | `shared → pages` 임포트는 `fsd/forbidden-imports`, 공개 API 우회는 `fsd/no-public-api-sidestep` 으로 차단됩니다 |
| 진입점 파일이 미분류로 경고되는가 | 경고되지 않습니다. 의도를 남기기 위해 `ignores` 에 등재합니다 |
| 배럴이 지연 청크 분리를 방해하는가 | **같은 배럴을 즉시 임포트와 지연 임포트가 함께 쓰면 방해합니다.** 라우트가 배럴에서 프로바이더를 즉시 가져오면서 같은 배럴을 `loadComponent` 로도 부르자 지연 청크가 91바이트 재수출 껍데기만 남고 화면 코드가 초기 번들에 들어갔습니다. 즉시 쓰는 심볼을 전용 진입점으로 분리하니 초기 번들이 517kB 에서 377kB 로, 지연 청크가 91바이트에서 141kB 로 바뀌었습니다 |
| 배럴을 한쪽으로만 쓰면 어떤가 | 간섭이 없습니다. 미사용 재수출은 트리셰이킹됩니다 |
| 배럴이 `@defer` 의 의존성 분리를 방해하는가 | **방해합니다.** 같은 배럴에서 즉시 쓰는 심볼과 `@defer` 안에서만 쓰는 심볼을 함께 가져오면 배럴 모듈이 정적으로 묶여 지연 청크가 만들어지지 않습니다. 임포트 경로를 컴포넌트별로 나눈 결과 초기 번들이 544kB 에서 275kB 로 줄었습니다 |
| 리졸버가 초기 번들에 포함되는가 | 포함됩니다. 같은 배럴의 컴포넌트는 지연 청크로 분리됩니다 |
| `baseUrl` 사용 가능 여부 | 사용 불가입니다. TypeScript 6 에서 `TS5101` 오류가 발생합니다 |
| Steiger 가 상대 경로 위반을 잡는가 | 잡습니다. 별칭 규칙의 근거는 검출 가능성이 아니라 파일 이동 내성입니다 |
| 동적 토큰 주입을 구문 규칙으로 잡는가 | 잡지 못합니다. `Map.get` 등 정상 호출과 구분되지 않아 `Injector` 임포트 제한으로 대체합니다 |
| 생성물 수정을 린터로 막는가 | 막지 못합니다. 린터는 편집을 차단하지 않으므로 CI 재생성 검사로 대체합니다 |
| Spartan helm 이 Signal Forms 와 연결되는가 | 직접 연결됩니다. `[formField]`·`[formRoot]` 바인딩이며 compat 계층이 필요 없습니다 |
| 지연 로딩이 정적 생성 경로의 첫 표시를 늦추는가 | 늦추지 않습니다. 사전 렌더된 HTML 에 지연 청크의 `modulepreload` 힌트가 포함되어 초기 번들과 병렬로 받습니다 |
| helm 사본의 업스트림 갱신 수단이 있는가 | `@spartan-ng/cli:healthcheck --autoFix` 가 폐기 API 를 조정합니다. 시각적 개선만 수동 대상입니다 |
| brain 이 오버레이 위치 전략 교체를 허용하는가 | 허용합니다. `BrnOverlay` 의 `positionStrategy` 입력이 기본 전략보다 우선하며, 앱 전역 기본값은 `provideBrnOverlayDefaultOptions()` 로 지정합니다 |
| brain 의 캘린더가 키보드와 ARIA 를 제공하는가 | 제공합니다. 화살표·`Home`·`End`·`PageUp`·`PageDown`, 로빙 탭인덱스, `role="grid"`, 셀의 `aria-label`·`aria-selected`·`aria-disabled` 가 모두 구현되어 있습니다 |
| `BreakpointObserver` 가 서버에서 예외를 발생시키는가 | 발생시키지 않습니다. `MediaMatcher` 가 비브라우저 환경에서 `noopMatchMedia` 로 대체되어 모든 쿼리에 `matches: false` 를 즉시 방출합니다 |
| 비ASCII 경로를 정적 생성할 수 있는가 | 생성은 되지만 **서빙되지 않습니다.** 한글 경로의 `index.html` 이 정확히 만들어지고 목록에도 등재되나 요청 시 404 가 반환됩니다. [08. 라우팅](08-routing.md) 1.1절의 슬러그 규칙이 여기서 나옵니다 |
| `allowedHosts` 기본값으로 SSR 서버가 동작하는가 | 동작하지 않습니다. `angular.json` 의 `security.allowedHosts` 가 빈 배열이면 모든 요청이 400 으로 거부됩니다. 정적 생성만 확인하면 드러나지 않고 서버를 실제로 띄울 때 전부 막힙니다 |
| Steiger 가 슬라이스 그룹 이름을 제한하는가 | 제한합니다. 그룹 이름이 `shared` 의 세그먼트 이름과 겹치면 `fsd/ambiguous-slice-names` 가 빌드를 실패시킵니다 |
| Tailwind preflight 가 `button` 의 `text-align` 을 되돌리는가 | **되돌리지 않습니다.** 여백·테두리·글꼴·배경은 초기화하지만 정렬은 브라우저 기본값 `center` 가 남습니다. 버튼 안에서 폭이 내용만큼인 요소는 증상이 드러나지 않고 `w-full` 인 요소만 가운데로 가므로, 한 버튼 안에서 줄마다 정렬이 갈립니다 |
| `afterNextRender` 가 정적 생성 시점에도 실행되는가 | **실행되지 않습니다.** 브라우저 전용이라 그 안에서 화면 구성을 바꾸면 생성된 HTML 에 빠지고 하이드레이션 이후에야 나타납니다. 개발 서버에서는 부팅이 빨라 알아채기 어렵습니다 |
| Signal Forms 의 필드 바인딩 이름이 무엇인가 | `[formField]` 입니다. 디렉티브 클래스는 `FormField` 이며 `Field` 는 타입이라 `imports` 에 넣으면 값이 아니라는 오류가 납니다 |
| Signal Forms 폼에 `novalidate` 가 필요한가 | **필요합니다.** 검증 규칙이 DOM 에 `required` 같은 제약 속성으로 반영되므로, 없으면 브라우저 기본 검증이 제출을 가로채 핸들러가 아예 실행되지 않습니다 |
| `(ngSubmit)` 이 Signal Forms 폼에서 발화하는가 | **발화하지 않습니다.** 그 출력은 Reactive Forms 의 `formGroup` 디렉티브가 제공합니다. 없는 채로 쓰면 빌드가 통과하고 제출만 조용히 동작하지 않습니다 |
| Spartan 기본 테마가 접근성 기준을 충족하는가 | **충족하지 않습니다.** 라이트에서 `muted-foreground` 가 `muted` 위 4.34:1, `input` 이 배경 위 1.26:1, `ring` 이 2.59:1 입니다. 기준을 넘는 값으로 올려 씁니다 |
| 템플릿에서 참조하는 식별자에 한글을 쓸 수 있는가 | **쓸 수 없습니다.** 템플릿 표현식 파서가 한글 식별자를 `NG5002 Lexer Error` 로 거부합니다. TypeScript 는 허용하므로 컴파일 단계에서야 드러납니다 |
| 투영된 콘텐츠가 DI 로 삽입 위치의 부모를 찾는가 | **찾지 못합니다.** 투영된 콘텐츠의 인젝터는 선언 위치인 호출부이지 삽입 위치가 아닙니다. `contentChild` 쿼리로 인스턴스를 찾아 값을 밀어 넣습니다 |
| 내용에 따라 변하는 높이에 CSS 전환을 걸 수 있는가 | **걸 수 없습니다.** 전환은 계산값이 바뀔 때 발화하는데 자식이 늘고 줄어도 `height` 의 계산값은 `auto` 로 같습니다. `ResizeObserver` 로 내용을 재서 픽셀로 지정해야 하며, 관찰 대상은 지정 대상이 아니라 그 안의 내용이어야 합니다 |

## 8. 규칙의 예외

| 대상 | 완화한 규칙 | 사유 |
| :--- | :--- | :--- |
| `src/server.ts`, `src/main.server.ts` | `no-console` | Node 진입점은 stdout 이 표준 로깅 채널입니다. 브라우저 콘솔로의 개인정보 유출이라는 규칙의 근거가 적용되지 않습니다 |
| `src/pages/**` | Steiger `excessive-slicing` | 슬라이스가 하나뿐인 초기 단계에서는 과분할 지적이 유효하지 않습니다. 슬라이스가 셋 이상이 되면 제거합니다 |
| `src/shared/api/generated/**` | ESLint 전체 | 생성물에 대한 지적은 고칠 수 없으므로 잡음이 됩니다 |
| `src/shared/ui/**` | ESLint 선택자 접두사 | helm 은 `hlm` 접두사가 Spartan 규약입니다. `app` 으로 바꾸면 재생성 때마다 되돌아옵니다 |
| `src/shared/ui/**` | ESLint `Injector` 임포트 제한 | helm 의 `Injector` 는 `runInInjectionContext` 인자이며 규칙이 막으려는 `Injector.get` 이 아닙니다. 나머지 제한은 유지합니다 |
| `src/shared/ui/**` | ESLint `no-input-rename` | `aria-label` 처럼 표준 속성명을 그대로 받으려면 별칭이 필요합니다 |
| `src/shared/ui/**` | Steiger `public-api`, `no-reserved-folder-names` | helm 의 폴더 구조를 생성기가 정합니다. 상세는 [04. 디자인 시스템](04-design-system.md) 1.1절에 있습니다 |
| 전역 | Steiger `no-public-api-sidestep` | 컴포넌트별 경로를 우회로 오판하며 규칙 단위 예외가 없습니다. ESLint `no-restricted-imports` 패턴이 대체하므로 슬라이스 내부 파일 임포트는 여전히 차단됩니다 |

예외를 추가할 때는 **완화한 규칙의 근거가 왜 그 대상에 적용되지 않는지**를 함께 적습니다. 사유 없는 예외는 규칙을 무력화합니다.

## 9. 미확인 항목

| 항목 | 확인할 내용 | 필요 조건 |
| :--- | :--- | :--- |
| helm 컴포넌트의 오버레이 입력 전달 | 복사된 helm 이 `positionStrategy` 를 brain 으로 전달하는지 | 해당 컴포넌트 추가 후 |
| 캘린더 라벨의 한국어화 | `provideBrnCalendarI18n()` 으로 대체할 항목의 범위 | 날짜 선택기 구현 시 |
| `@defer` 와 컨텐츠 프로젝션 | `ng-content` 전달 시 제약 | 적응형 컴포넌트 구현 시 |
| `validateHttp` 의 요청 취소 | 값이 빠르게 바뀔 때 이전 요청 취소 여부 | 폼 구현 시 |
| 대기 시간 기본값 | `--wait-delay` 200ms · `--wait-min` 400ms 가 실제 응답 분포에 맞는지 | 실사용 데이터 확보 후 |
