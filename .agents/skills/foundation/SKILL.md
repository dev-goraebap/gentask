---
name: foundation
description: >-
  프런트엔드 디자인 시스템을 설계·스캐폴딩할 때 사용한다. 다루는 범위: 디자인 토큰(톤 & 매너,
  색·타이포·간격·반경·모션), 재사용 UI 컴포넌트, 헤드리스 동작 조달(위젯 프리미티브 + 조각 유틸리티),
  컴포넌트 내재 접근성(포커스·키보드·ARIA), 표현(토큰으로 스타일링), 이식 가능한 컴포넌트 계약.
  Keywords: design system, design tokens, theme, tone and manner, DTCG, semantic tokens, dark mode,
  UI components, component library, headless UI, primitives, shadcn, Base UI, React Aria, Radix,
  Ark UI, Bits UI, Reka UI, Angular CDK, accessibility, focus management, keyboard navigation, ARIA,
  컴포넌트 라이브러리, 버튼·모달·콤보박스, 토큰, 다크모드, 톤앤매너.
  프레임워크 비종속(Angular, Next.js, SvelteKit, Nuxt, SolidStart, Remix, Vite 등) — 프레임워크는
  어떤 라이브러리를 고르느냐만 바꾸고, 내리는 결정 자체는 바꾸지 않는다.
license: Apache-2.0
metadata:
  author: dev.goraebap
  version: "0.1"
  collection: wellmade-web
---

# foundation

디자인 시스템을 설계·스캐폴딩한다. 다루는 범위: 디자인 토큰/테마, UI 컴포넌트, 동작 조달,
컴포넌트 내재 접근성, 이식 가능한 컴포넌트 계약.

## 언제 활성화하나

- "디자인 시스템 / 컴포넌트 라이브러리를 구성해 줘"
- "디자인 토큰 / 톤 & 매너 / 테마를 정의해 줘", 다크모드
- "재사용 / 프리미티브 UI 컴포넌트를 만들어 줘", "버튼·모달을 매번 다시 만든다"
- "`<프레임워크>`용 헤드리스 / shadcn 스타일 라이브러리를 골라 줘"
- "유지되는 라이브러리 vs 직접 구축 중 결정해 줘"
- 위 작업에 대한 리뷰

## 운영 메모

- **산출물을 만든다.** 조언이 아니라 파일을 남긴다: 토큰 파일, DESIGN.md, 컴포넌트 계약, ADR.
- **라이브러리 사실은 검증한다.** 아래 이름은 출발점이다(2026-06 기준). 추천 확정 전에 최신 릴리스,
  오픈 이슈 건강도, 프레임워크 버전 호환성을 웹 검색한다. 메모리에 의존하지 않는다.
- **분기점을 먼저 끌어낸다.** 깊은 작업 전에 타깃 플랫폼, 라이브러리 vs 직접 구축 선호를 확인한다.
  프로젝트 파일이 이미 답한 것은 다시 묻지 않는다.

---

## 1. 환경 감지

프레임워크를 추측하지 않는다. `package.json`(의존성·스크립트)과 lockfile, 프레임워크 설정
파일(`angular.json`/`next.config.*`/`svelte.config.js`/`nuxt.config.*`/`vite.config.*`)을 읽어
식별한다: 프레임워크/메타프레임워크, 스타일링 솔루션(Tailwind / CSS Modules / vanilla-extract /
Panda / UnoCSS / 순수 CSS), 패키지 매니저, 이미 설치된 헤드리스 라이브러리. 프로젝트가 없으면
프레임워크와 스타일링 방식을 묻는다.

## 2. 디자인 토큰 / 테마

전체 방법: `references/design-tokens.md`. 핵심:

- 톤 & 매너의 출처를 수집한다(사용자 설명, 기존 DESIGN.md, 참조 사이트, 스크린샷, Figma 익스포트).
  무에서 지어내지 않는다.
- 토큰을 3계층으로 추출한다: **프리미티브**(원시 팔레트/스케일) → **시맨틱**(역할 기반:
  `color.bg.surface`, `color.text.muted`, `space.inset.md`) → **컴포넌트**(선택). 컴포넌트는
  프리미티브가 아니라 **시맨틱** 토큰을 읽는다 — 그래야 테마·다크모드가 싸다.
- W3C **DTCG** 포맷(`$value`/`$type`)으로 작성한다. 감지된 스타일링 솔루션에 맞는 빌드 단계를
  계획한다(Style Dictionary → CSS 변수 / Tailwind 테마 / TS).
- **DESIGN.md**를 작성한다(토큰 뒤의 무드·밀도·모션 개성·Do/Don't). `assets/DESIGN.template.md`,
  토큰 시작본은 `assets/tokens.dtcg.example.json`.

## 3. 컴포넌트 (동작 조달 + 표현)

컴포넌트는 **동작(behavior)** 과 **표현(presentation)** 으로 이루어진다. 동작은 조달하고, 표현은
2장 시맨틱 토큰으로 입힌다.

### 3.1 인벤토리 먼저 합의

개별 컴포넌트로 들어가기 전에 기본 인벤토리를 제시하고 스코프를 합의한다. 빠지기 쉬운 것
(라디오·스위치·툴팁·스켈레톤·페이지네이션)을 먼저 짚는다. 등급별 목록: `references/component-inventory.md`.
한 번에 다 만들지 말고 쓰는 것부터 만들되, 인벤토리를 남은 후보 체크리스트로 둔다.

### 3.2 동작 조달 (바퀴 재발명 금지)

접근성·키보드·상태·위치 지정 로직은 직접 떠안지 않는다. 두 단위로 조달한다. 매트릭스·선택 기준:
`references/component-behavior.md`.

- **위젯 단위 — 헤드리스 UI 프리미티브.** Dialog / Combobox / Menu / DatePicker 같은 위젯 전체.
  예: Base UI, React Aria, Ark UI, Bits UI, Reka UI, Angular CDK + Spartan.
- **조각 단위 — 헤드리스 유틸리티(CDK 대응).** 여러 위젯에 걸쳐 재사용되는 로직(포지셔닝, 가상화,
  드래그, 포커스 트랩, 날짜 연산). 예: floating-ui, TanStack Virtual, dnd-kit, focus-trap.

규칙:
- 유지되는 헤드리스 라이브러리를 기본으로 한다. 채택한 위젯 프리미티브가 이미 포함한 기능
  (포커스 트랩 / scroll-lock / 포지셔닝)을 조각 라이브러리로 중복하지 않는다.
- 직접 구축은 요구가 정말 특이하거나 유지되는 옵션이 없을 때만. 그 경우에도 어려운 부분
  (포지셔닝·포커스 트랩·리스트 키보드 내비)은 조각 유틸리티에 기댄다.
- **의견 키트**(Material, daisyUI, PrimeNG, ng-zorro)는 동작 + 표현 + *그들의 디자인 의견*을 한 번에
  들고 와 2장에서 설계한 자체 토큰을 덮어쓴다. **기본 경로에서 제외**하고, 기각 사유를 ADR에 남긴다.
- shadcn 스타일은 동작 프리미티브 + 기본 표현을 *복사*해 코드를 소유하게 한다 — 무거운 커스터마이징에 적합.

### 3.3 컴포넌트 내재 접근성

동작 조달의 핵심 이유가 접근성이다. 포커스 관리, 키보드 인터랙션, ARIA는 위젯 프리미티브가
이미 품는다. 직접 구축할 때도 이 부분은 조각 유틸리티(focus-trap 등)에 기댄다. 컴포넌트는
키보드 경로·포커스 동작·ARIA 역할·접근가능 이름을 갖춘 상태로만 "완성"으로 본다.

### 3.4 표현 입히기

동작 골격에 2장 **시맨틱** 토큰을 입힌다. shadcn 경로면 딸려 온 표현을 자체 토큰으로 다시 칠한다.
컴포넌트가 프리미티브가 아니라 시맨틱 토큰을 읽게 해 테마·다크모드를 공짜로 만든다.

각 컴포넌트를 **동작과 토큰 사용** 기준으로 이식 가능한 계약으로 기록한다:
`assets/component-contract.template.md`.

---

## 결정 기록 — ADR

다음 선택은 짧은 ADR로 남긴다: 토큰 아키텍처(3계층·DTCG·빌드·테마), 컴포넌트 동작 조달(위젯
프리미티브·조각 유틸리티·의견 키트 기각 사유), 라이브러리 vs 직접 구축. 작성법은
`references/adr-guide.md`, 템플릿은 `assets/adr.template.md`. 결정마다 하나씩 번호를 매겨
`docs/adr/` 또는 `decisions/`에 저장하고, 기각한 선택지도 사유와 함께 적는다.

## 적용 체크리스트

1. [ ] 환경 감지: 프레임워크·스타일링·패키지매니저·기존 라이브러리 (1장)
2. [ ] 토큰 3계층(프리미티브→시맨틱→컴포넌트), 컴포넌트는 시맨틱만 읽음 (2장)
3. [ ] DTCG 포맷 + 스타일링에 맞는 빌드 단계 (2장)
4. [ ] DESIGN.md 작성 (2장)
5. [ ] 컴포넌트 인벤토리 제시·스코프 합의 (3.1)
6. [ ] 동작 조달: 위젯 프리미티브 + 조각 유틸리티, 유지보수 상태 검증, 중복 금지 (3.2)
7. [ ] 의견 키트 기본 경로 제외 + 기각 ADR (3.2)
8. [ ] 내재 a11y: 키보드·포커스·ARIA·접근가능 이름 (3.3)
9. [ ] 시맨틱 토큰으로 표현, 컴포넌트 계약 기록 (3.4)
10. [ ] 결정을 ADR로 기록

## 참조 파일 (필요할 때만 읽는다)

- `references/design-tokens.md` — 2장: 톤 & 매너 수집, 3계층 DTCG 토큰, 빌드, 테마/다크모드.
- `references/component-inventory.md` — 3.1: 등급별 컴포넌트 인벤토리 체크리스트.
- `references/component-behavior.md` — 3.2: 파트 A 위젯 프리미티브 + 파트 B 조각 유틸리티 매트릭스.
- `references/adr-guide.md` — ADR 작성·정리법.

## 템플릿 (`assets/`)

- `DESIGN.template.md` — 톤 & 매너 / 디자인 언어 문서.
- `tokens.dtcg.example.json` — 3계층 DTCG 토큰 시작본.
- `component-contract.template.md` — 이식 가능한 컴포넌트 명세.
- `adr.template.md` — 단일 결정 ADR.
