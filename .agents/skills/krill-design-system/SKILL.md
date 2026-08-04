---
name: krill-design-system
description: Krill 디자인 시스템으로 UI를 만들거나 고칠 때 쓴다. Tailwind CSS 기반이며 토큰 CSS 한 장과 복사용 클래스 조합을 제공한다. 버튼·입력·카드·칩·표·알림·아바타·스켈레톤·지표 타일의 클래스 조합, OKLCH 색 토큰, 다크 테마, 타이포 스케일, 다이얼로그·팝오버·탭·토스트의 ARIA와 키보드 동작 계약을 다룬다. 디자인 시스템, 디자인 토큰, Krill, krill.css, 색 대비, WCAG 접근성, Tailwind 컴포넌트 스타일링 관련 작업에 적용한다.
license: MIT
metadata:
  author: dev-goraebap
  version: '1.0'
  homepage: https://krill.goraebap.xyz
---

# Krill 디자인 시스템

Tailwind CSS 위에서 쓰는 디자인 시스템. 설치할 패키지가 없다. 토큰 CSS 한 장을 붙여넣고 클래스 조합을 복사해서 쓴다.

## 언제 쓰는가

- UI 컴포넌트를 새로 만들거나 스타일을 고칠 때
- 색·간격·타이포를 정해야 할 때
- 다이얼로그·드롭다운·툴팁의 접근성 동작을 구현할 때

## 먼저 확인할 것

프로젝트에 Krill 토큰이 이미 있는지 본다. `styles.css`나 `globals.css`에서 `--color-primary`, `--color-fg-muted` 같은 변수를 찾는다.

없으면 `assets/krill.css`를 프로젝트의 Tailwind 진입점에 붙여넣는다.

```css
@import 'tailwindcss';
/* 여기에 krill.css 내용 */
```

## 반드시 지킬 규칙

### 1. 색·간격·라운딩을 하드코딩하지 않는다

토큰이 만든 유틸리티만 쓴다.

| 하지 말 것                | 대신                     |
| ------------------------- | ------------------------ |
| `bg-white`, `bg-gray-100` | `bg-surface`, `bg-muted` |
| `text-gray-500`           | `text-fg-muted`          |
| `border-gray-200`         | `border-border`          |
| `bg-[#4a5d23]`            | `bg-primary`             |
| `rounded-[10px]`          | `rounded-md`             |

필요한 값이 토큰에 없으면 `krill.css`에 먼저 추가한다. 컴포넌트에 값을 박아 넣지 않는다.

### 2. 색만으로 의미를 전달하지 않는다

시그널 색에는 항상 텍스트나 아이콘을 동반한다. 추세를 표시할 때는 색과 함께 `↑`·`↓`를 넣는다. WCAG 1.4.1.

### 3. 폼 컨트롤 테두리는 `border-border-control`

`border-border`와 `border-border-strong`은 장식선이다. 입력란이나 secondary 버튼처럼 **테두리가 컴포넌트 경계를 알리는 유일한 단서**일 때는 3:1을 만족하는 `border-border-control`을 쓴다. WCAG 1.4.11.

### 4. 깊이는 보더로 낸다

카드를 띄워 보이게 하려고 그림자를 쓰지 않는다. 그림자는 실제로 떠 있는 것(모달·팝오버·드롭다운)에만 쓴다.

| 상황                    | 방법                      |
| ----------------------- | ------------------------- |
| 같은 평면에서 영역 구분 | `border border-border`    |
| 실제로 떠 있음          | `shadow-md` / `shadow-lg` |

### 5. 수치는 모노스페이스

숫자·지표·코드에는 `font-mono tabular-nums`를 건다. 표의 수치 열은 `text-end`로 정렬한다.

## 참조 파일

| 파일                       | 언제 읽는가                             |
| -------------------------- | --------------------------------------- |
| `references/components.md` | 컴포넌트 클래스 조합이 필요할 때        |
| `references/tokens.md`     | 토큰 이름과 값을 확인할 때              |
| `references/behavior.md`   | 다이얼로그·드롭다운·탭·토스트를 만들 때 |
| `assets/krill.css`         | 프로젝트에 토큰을 처음 넣을 때          |

전체 문서는 https://krill.goraebap.xyz/llms-full.txt 에 있다.

## 다크 테마

`.dark` 클래스가 색 토큰만 덮어쓴다. `bg-surface` 같은 유틸리티를 쓰면 자동으로 따라오므로 `dark:` 변형을 별도로 달지 않는다.

```html
<!-- 이렇게 하지 않는다 -->
<div class="bg-white dark:bg-zinc-900">
  <!-- 이렇게 한다 -->
  <div class="bg-surface"></div>
</div>
```

## 프레임워크 래퍼

같은 클래스를 반복해서 쓴다면 맵으로 뽑는다. 패턴은 모든 컴포넌트가 같다 — 베이스 문자열, variant 맵, size 맵, 얇은 래퍼.

표현만 감싼다. 상태 관리나 폼 로직을 래퍼에 넣으면 프로젝트마다 요구가 갈려 결국 다시 쓰게 된다.

## 동작이 필요한 컴포넌트

드롭다운·모달·툴팁은 클래스만으로 만들 수 없다. 구현체를 직접 짜지 말고 헤드리스 라이브러리를 쓴다.

| 문제            | 권장                             |
| --------------- | -------------------------------- |
| 플로팅 포지셔닝 | Floating UI (전 프레임워크 공통) |
| React 전체 세트 | Radix UI, Base UI, shadcn/ui     |
| Svelte          | Melt UI, Bits UI                 |
| Angular         | Angular CDK                      |

`references/behavior.md`의 계약을 만족하면 무엇을 쓰든 상관없다.
