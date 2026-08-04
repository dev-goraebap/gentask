# 토큰 목록

`krill.css` 에서 생성된다. 직접 고치지 말고 `node skills/sync.mjs` 를 다시 돌린다.

Tailwind 유틸리티 이름은 접두사를 뗀 형태다 — `--color-surface` 는 `bg-surface`, `text-surface`, `border-surface` 로 쓴다.

## 색

| 토큰                      | 라이트                        | 다크                     |
| ------------------------- | ----------------------------- | ------------------------ |
| `--color-background`      | `oklch(0.97 0.006 110)`       | `oklch(0.175 0.008 118)` |
| `--color-surface`         | `oklch(0.995 0.002 110)`      | `oklch(0.215 0.01 118)`  |
| `--color-elevated`        | `oklch(1 0 0)`                | `oklch(0.255 0.012 118)` |
| `--color-chrome`          | `oklch(0.985 0.004 110)`      | `oklch(0.2 0.008 118)`   |
| `--color-muted`           | `oklch(0.945 0.008 110)`      | `oklch(0.285 0.014 118)` |
| `--color-overlay`         | `oklch(0.18 0.01 110 / 0.45)` | `oklch(0 0 0 / 0.6)`     |
| `--color-border`          | `oklch(0.915 0.008 110)`      | `oklch(1 0 0 / 0.1)`     |
| `--color-border-strong`   | `oklch(0.85 0.012 110)`       | `oklch(1 0 0 / 0.2)`     |
| `--color-border-control`  | `oklch(0.645 0.012 110)`      | `oklch(1 0 0 / 0.3)`     |
| `--color-fg`              | `oklch(0.23 0.015 110)`       | `oklch(0.96 0.005 110)`  |
| `--color-fg-muted`        | `oklch(0.47 0.02 110)`        | `oklch(0.74 0.02 110)`   |
| `--color-fg-faint`        | `oklch(0.63 0.02 110)`        | `oklch(0.58 0.02 110)`   |
| `--color-fg-inverse`      | `oklch(0.99 0.003 110)`       | `oklch(0.18 0.008 118)`  |
| `--color-primary`         | `oklch(0.5 0.105 118)`        | `oklch(0.68 0.12 118)`   |
| `--color-primary-hover`   | `oklch(0.44 0.105 118)`       | `oklch(0.73 0.12 118)`   |
| `--color-primary-pressed` | `oklch(0.38 0.1 118)`         | `oklch(0.78 0.11 118)`   |
| `--color-primary-soft`    | `oklch(0.95 0.04 118)`        | `oklch(0.3 0.05 118)`    |
| `--color-primary-fg`      | `oklch(0.99 0.02 118)`        | `oklch(0.18 0.03 118)`   |
| `--color-success`         | `oklch(0.52 0.13 150)`        | `oklch(0.72 0.14 150)`   |
| `--color-warning`         | `oklch(0.535 0.13 75)`        | `oklch(0.78 0.13 80)`    |
| `--color-info`            | `oklch(0.525 0.1 235)`        | `oklch(0.72 0.11 235)`   |
| `--color-danger`          | `oklch(0.545 0.2 25)`         | `oklch(0.7 0.17 25)`     |
| `--color-success-soft`    | `oklch(0.95 0.04 150)`        | `oklch(0.3 0.05 150)`    |
| `--color-warning-soft`    | `oklch(0.95 0.05 80)`         | `oklch(0.32 0.05 80)`    |
| `--color-info-soft`       | `oklch(0.95 0.04 235)`        | `oklch(0.3 0.05 235)`    |
| `--color-danger-soft`     | `oklch(0.95 0.04 25)`         | `oklch(0.32 0.06 25)`    |

## 라운딩

| 토큰            | 값      |
| --------------- | ------- |
| `--radius-none` | `0px`   |
| `--radius-sm`   | `6px`   |
| `--radius-md`   | `10px`  |
| `--radius-lg`   | `16px`  |
| `--radius-xl`   | `24px`  |
| `--radius-full` | `999px` |

`md` 이상에는 초타원 곡선(`corner-shape: superellipse(1.6)`)이 걸린다.

## 그림자

| 토큰          | 값                                                                     |
| ------------- | ---------------------------------------------------------------------- |
| `--shadow-sm` | `0 1px 2px rgba(16, 18, 24, 0.06)`                                     |
| `--shadow-md` | `0 8px 24px rgba(16, 18, 24, 0.1), 0 1px 2px rgba(16, 18, 24, 0.06)`   |
| `--shadow-lg` | `0 24px 60px rgba(16, 18, 24, 0.16), 0 2px 6px rgba(16, 18, 24, 0.08)` |

## 타이포 스케일

| 토큰                          | 값                            |
| ----------------------------- | ----------------------------- |
| `--text-display-size`         | `clamp(2.75rem, 6vw, 4.5rem)` |
| `--text-display-weight`       | `600`                         |
| `--text-display-tracking`     | `-0.03em`                     |
| `--text-display-leading`      | `1.04`                        |
| `--text-headline-lg-size`     | `2.25rem`                     |
| `--text-headline-lg-weight`   | `600`                         |
| `--text-headline-lg-tracking` | `-0.02em`                     |
| `--text-headline-lg-leading`  | `1.12`                        |
| `--text-headline-md-size`     | `1.5rem`                      |
| `--text-headline-md-weight`   | `600`                         |
| `--text-headline-md-tracking` | `-0.015em`                    |
| `--text-headline-md-leading`  | `1.2`                         |
| `--text-title-md-size`        | `1.125rem`                    |
| `--text-title-md-weight`      | `600`                         |
| `--text-title-md-tracking`    | `-0.01em`                     |
| `--text-title-md-leading`     | `1.3`                         |
| `--text-body-md-size`         | `0.9375rem`                   |
| `--text-body-md-weight`       | `400`                         |
| `--text-body-md-tracking`     | `-0.005em`                    |
| `--text-body-md-leading`      | `1.55`                        |
| `--text-body-sm-size`         | `0.8125rem`                   |
| `--text-body-sm-weight`       | `400`                         |
| `--text-body-sm-tracking`     | `0`                           |
| `--text-body-sm-leading`      | `1.5`                         |
| `--text-label-sm-size`        | `0.75rem`                     |
| `--text-label-sm-weight`      | `500`                         |
| `--text-label-sm-tracking`    | `0.08em`                      |
| `--text-label-sm-leading`     | `1.2`                         |
| `--text-mono-sm-size`         | `0.8125rem`                   |
| `--text-mono-sm-weight`       | `500`                         |
| `--text-mono-sm-tracking`     | `0`                           |
| `--text-mono-sm-leading`      | `1.4`                         |
| `--text-metric-size`          | `2.5rem`                      |
| `--text-metric-weight`        | `600`                         |
| `--text-metric-tracking`      | `-0.02em`                     |
| `--text-metric-leading`       | `1`                           |

`.t-*` 유틸리티가 이 값들을 한 세트로 적용한다.

## 모션

| 토큰                | 값                               |
| ------------------- | -------------------------------- |
| `--motion-fast`     | `120ms`                          |
| `--motion-base`     | `150ms`                          |
| `--motion-slow`     | `240ms`                          |
| `--easing-standard` | `cubic-bezier(0.2, 0.6, 0.2, 1)` |

## 레이아웃·포커스

| 토큰                 | 값                                  |
| -------------------- | ----------------------------------- |
| `--container-max`    | `1200px`                            |
| `--container-pad`    | `clamp(20px, 4vw, 48px)`            |
| `--focus-ring-color` | `oklch(0.5 0.105 118 / 0.32)`       |
| `--focus-ring`       | `0 0 0 3px var(--focus-ring-color)` |
