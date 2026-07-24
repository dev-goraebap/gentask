# ADR 가이드 — 결정 기록하기

이 워크플로의 의미 있는 모든 선택은 짧은 **아키텍처 결정 기록(Architecture
Decision Record, ADR)**이 됩니다. ADR은 설정 더미를 *유지보수 가능하고* 온보딩
가능한 디자인 시스템으로 바꾸는 것입니다: *무엇*만이 아니라 *왜*를 담아, 미래의
기여자(그리고 AI 도구)가 이미 정해진 선택을 다시 따지거나 실수로 되돌리지 않도록
합니다.

## ADR 하나당 결정 하나

하나의 거대한 문서가 아니라 **중요한 결정마다 하나의 ADR**을 작성하세요. 순차적으로
번호를 매기고 관례적인 디렉터리에 저장하세요: `docs/adr/0001-title.md` (또는
`decisions/`). 번호는 안정적인 참조와 시간순 기록을 제공합니다.

## 이 워크플로에서 ADR을 받을 만한 것

최소한 다음을 기록하세요:
- **토큰 아키텍처** — 3계층 구조, DTCG 포맷, 빌드 파이프라인, 테마 적용 방식.
- **컴포넌트 동작 조달** — 위젯 단위 프리미티브(어떤 라이브러리를, 설치 vs. 복사,
  또는 커스텀 구축)와 조각 단위 유틸리티(선택한 CDK 등가 세트), 그리고 **의견 키트를
  기각한 사유**, 그 이유.

*거부된* 옵션을 기록하는 것은 선택된 옵션만큼 중요합니다. 팀이 6개월 후에 같은
대안을 다시 평가하는 것을 막아줍니다.

## 포맷

`assets/adr.template.md`의 가벼운 Nygard 스타일 템플릿을 사용하세요:

```
# <NUMBER>. <short decision title>

- Status: proposed | accepted | superseded by ADR-XXXX
- Date: YYYY-MM-DD
- Deciders: <who>

## Context
What's the situation and the forces at play? What constraints (framework,
styling solution, team, platforms) apply? Keep it factual.

## Decision
The choice we are making, stated plainly in active voice
("We will use … because …").

## Options considered
- Option A — pros / cons
- Option B — pros / cons
- Option C — pros / cons

## Consequences
What becomes easier and what becomes harder as a result. Follow-ups, risks,
and the trigger that would make us revisit this.
```

## 정직하고 최신으로 유지하라

- ADR은 나중에 일괄로 소급해서가 아니라 **결정이 내려질 때** 작성하세요.
- 나중의 결정이 이전 것을 뒤집을 때 옛 ADR을 **삭제하지 마세요** — 상태를
  `superseded by ADR-XXXX`로 설정하고 앞으로 링크하세요. 그 이력이 핵심입니다.
- 각 ADR은 짧게(화면 한두 개) 유지하세요. 아무도 읽지 않는 ADR은 오래된 스토리만큼
  쓸모없습니다.

## DESIGN.md와의 연계

ADR과 `DESIGN.md`는 서로 다른 역할을 합니다: **DESIGN.md**는 디자인 언어의 살아있는
서사(톤, 무드, 권장/금지)이고, **ADR**은 특정 엔지니어링 선택의 날짜가 기록된
불변의 기록입니다. 서로 교차 링크하세요 — DESIGN.md는 토큰 아키텍처 ADR을 가리킬
수 있고, ADR은 브랜드 근거를 위해 DESIGN.md를 참조할 수 있습니다.
