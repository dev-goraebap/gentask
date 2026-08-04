# 컴포넌트 클래스 카탈로그

복사해서 쓰는 Tailwind 클래스 조합. 전부 Krill 토큰 유틸리티를 쓴다.

## Button

베이스에 variant와 size를 더한다.

```
inline-flex items-center justify-center gap-2 rounded-md font-sans font-medium
whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none
disabled:opacity-40 disabled:pointer-events-none
```

| variant   | 클래스                                                                        |
| --------- | ----------------------------------------------------------------------------- |
| primary   | `bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-pressed` |
| secondary | `bg-surface text-fg border border-border-control hover:bg-muted`              |
| tertiary  | `bg-transparent text-fg-muted hover:bg-muted hover:text-fg`                   |
| danger    | `bg-danger text-fg-inverse hover:brightness-105`                              |

| size | 클래스                            |
| ---- | --------------------------------- |
| sm   | `h-8 px-3 text-[0.8125rem]`       |
| md   | `h-10 px-[18px] text-sm`          |
| lg   | `h-12 px-[22px] text-[0.9375rem]` |

`primary`는 한 화면에 하나만 둔다. 동작은 `button`, 이동은 `a`.

## Input

```
w-full rounded-md border bg-surface px-3.5 font-sans text-[0.9375rem] text-fg
placeholder:text-fg-faint transition-colors focus:outline-none
disabled:opacity-40 disabled:pointer-events-none
```

| 형태    | 클래스                                   |
| ------- | ---------------------------------------- |
| 한 줄   | `h-10`                                   |
| 여러 줄 | `min-h-24 py-3 leading-relaxed resize-y` |

| 상태 | 클래스                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------- |
| 기본 | `border-border-control hover:border-fg-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--focus-ring-color)]` |
| 실패 | `border-danger shadow-[0_0_0_3px_var(--color-danger-soft)]` + `aria-invalid="true"`                                 |

## Field

| 역할   | 클래스                                   |
| ------ | ---------------------------------------- |
| 래퍼   | `flex flex-col gap-2` (요소는 `label`)   |
| 라벨   | `t-label-sm`                             |
| 도움말 | `t-body-sm text-fg-faint`                |
| 에러   | `t-body-sm text-danger` + `role="alert"` |

바깥을 `<label>`로 두면 `for`/`id` 없이 연결된다.

## Card

```
relative flex flex-col gap-4 rounded-lg p-6 transition-colors
```

| variant  | 클래스                                                        |
| -------- | ------------------------------------------------------------- |
| base     | `border border-border bg-elevated hover:border-border-strong` |
| elevated | `border border-border-strong bg-elevated shadow-md`           |

액센트 바를 쓰면 카드에 `overflow-hidden`을 더하고 첫 자식으로 둔다.

```html
<span class="absolute inset-x-0 top-0 h-0.5 bg-success"></span>
```

## Chip

```
inline-flex items-center gap-1 rounded-full font-sans font-medium
tabular-nums whitespace-nowrap
```

| size | 클래스                                          |
| ---- | ----------------------------------------------- |
| md   | `h-6 px-2.5 text-xs`                            |
| sm   | `h-5 min-w-5 justify-center px-1.5 text-[11px]` |

| tone    | 클래스                                        |
| ------- | --------------------------------------------- |
| primary | `bg-primary-soft text-primary`                |
| success | `bg-success-soft text-success`                |
| warning | `bg-warning-soft text-warning`                |
| info    | `bg-info-soft text-info`                      |
| danger  | `bg-danger-soft text-danger`                  |
| neutral | `bg-muted text-fg-muted border border-border` |

`sm`은 카운트 배지용. 숫자만 있으면 `aria-label`로 무엇의 개수인지 밝힌다.

## Table

| 역할    | 클래스                                                                  |
| ------- | ----------------------------------------------------------------------- |
| 래퍼    | `overflow-x-auto rounded-lg border border-border`                       |
| table   | `w-full min-w-full border-collapse`                                     |
| 헤더 행 | `border-b border-border bg-muted`                                       |
| th      | `t-label-sm px-4 py-3 text-start whitespace-nowrap`                     |
| 행      | `border-b border-border transition-colors last:border-0 hover:bg-muted` |
| td      | `px-4 py-3 font-sans text-[0.8125rem] whitespace-nowrap text-fg`        |
| 수치 td | `font-sans` 대신 `font-mono tabular-nums text-end`                      |

텍스트는 `text-start`, 수치는 `text-end` + 모노. `th`에 `scope="col"`을 둔다.

## Alert

| 역할      | 클래스                                             |
| --------- | -------------------------------------------------- |
| 래퍼      | `flex gap-3 rounded-lg p-4` + tone, `role="alert"` |
| 아이콘    | `mt-0.5 h-5 w-5 shrink-0`, `aria-hidden="true"`    |
| 본문 묶음 | `flex flex-col gap-0.5`                            |
| 제목      | `text-[0.9375rem] font-semibold text-fg`           |
| 본문      | `text-[0.875rem] text-fg-muted`                    |

| tone    | 클래스                         |
| ------- | ------------------------------ |
| info    | `bg-info-soft text-info`       |
| success | `bg-success-soft text-success` |
| warning | `bg-warning-soft text-warning` |
| danger  | `bg-danger-soft text-danger`   |

`role="alert"`는 끼어드는 알림이다. 페이지 로드 시부터 있던 안내문에는 붙이지 않는다.

## Avatar

```
inline-flex shrink-0 items-center justify-center overflow-hidden
bg-primary-soft text-primary font-sans font-medium
```

| 형태 | 클래스         |
| ---- | -------------- |
| 원형 | `rounded-full` |
| 사각 | `rounded-xl`   |

| size | 클래스                |
| ---- | --------------------- |
| sm   | `h-8 w-8 text-xs`     |
| md   | `h-10 w-10 text-sm`   |
| lg   | `h-12 w-12 text-base` |
| xl   | `h-16 w-16 text-lg`   |

이미지에는 `h-full w-full object-cover`. 이니셜만 쓸 때는 호스트에 `title`이나 `aria-label`로 전체 이름을 둔다.

## Skeleton

```
block animate-pulse bg-muted
```

모서리는 `rounded-sm` · `rounded-md` · `rounded-lg` · `rounded-full` 중에서 콘텐츠에 맞춰 고른다. 크기는 쓰는 쪽이 정한다.

호스트에 `aria-hidden="true"`. 모션 감소를 존중하려면 `animate-pulse` 대신 `motion-safe:animate-pulse`.

## Stat

| 역할       | 클래스                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 컨테이너   | `relative flex flex-col gap-4 overflow-hidden rounded-lg border border-border bg-elevated p-5` |
| 액센트 바  | `absolute inset-x-0 top-0 h-0.5` + `bg-primary` 등                                             |
| 라벨       | `t-label-sm`                                                                                   |
| 수치       | `font-mono text-[2.25rem] font-semibold leading-none tracking-tight tabular-nums text-fg`      |
| 푸터       | `flex items-center justify-between`                                                            |
| 스파크라인 | `h-8 w-24` + `text-primary` 등, `aria-hidden="true"`                                           |

추세는 색과 화살표를 함께 쓴다. 상승은 success 톤 + `↑`, 하락은 danger 톤 + `↓`.

## 타이포 유틸리티

`.t-display` `.t-headline-lg` `.t-headline-md` `.t-title-md` `.t-body-md` `.t-body-sm` `.t-label-sm` `.t-mono-sm` `.t-metric`

size·weight·tracking·leading이 한 세트로 적용된다. `.t-mono-sm`과 `.t-metric`에는 `tabular-nums`가 걸려 있다.
