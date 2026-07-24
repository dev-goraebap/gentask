# Component Contract — <ComponentName>

이식 가능하고 프레임워크에 종속되지 않는 명세. 프레임워크가 바뀌어도 다시 구현할 수
있도록 컴포넌트를 **동작과 토큰 사용** 기준으로 기술하라. 여기에 프레임워크별 코드는
적지 말 것. 그런 코드는 구현체에 둔다.

## Purpose
한 문장: 어떤 사용자 의도를 충족하는가.

## Anatomy
이름 붙은 구성 요소 (예: Root, Trigger, Content, Title, Close)와 그 중첩 구조.

## Props / API (타입이 아니라 의도)
- `<prop>` — 무엇을 제어하는지, 기본값, 허용 값.
- 제어(controlled) vs. 비제어(uncontrolled) 상태 (예: `open` / `value`).

## States & variants
- 비주얼 상태: default, hover, focus, active, disabled, loading, error.
- 변형(variant): 예: primary / secondary / ghost; 크기 sm / md / lg.

## Tokens consumed (시맨틱만)
이 컴포넌트가 읽는 **시맨틱** 토큰을 나열한다 — 원시(primitive) 토큰은 절대 안 됨.
- background: `color.bg.…`
- text: `color.text.…`
- border / radius / spacing / motion: `…`

## Behavior & accessibility
- 키보드 인터랙션 (Tab, Enter, Esc, Arrow keys 등).
- 포커스 관리 (trap? restore? initial focus?).
- ARIA roles / 레이블링 요구사항.
- 포인터 인터랙션.

## Underlying behavior sourcing
- 위젯 단위 프리미티브: <library or "custom">
- 조각 단위 유틸리티: <positioning / virtualization / focus-trap / …>

## Notes / decisions
관련 ADR(들)에 링크한다.
