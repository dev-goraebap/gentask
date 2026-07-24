# DESIGN.md — <Project / Brand name>

> 이 제품 디자인 언어의 살아있는 서사. 토큰은 값이 *무엇*인지를 인코딩하고,
> 이 문서는 *왜* 그런지를 인코딩한다. 짧고, 주관이 분명하며, 최신 상태로
> 유지하라. AI 도구와 새 기여자가 브랜드에 맞게 작업하기 위해 이 문서를 읽는다.

## 1. Personality (톤 & 매너)
세 개에서 다섯 개의 형용사. 각 형용사마다 UI에 미치는 결과를 한 줄로 적는다.
- 예: **Calm** — 넉넉한 여백, 낮은 채도, 느린 모션.
- 예: **Trustworthy** — 절제된 팔레트, 명확한 위계, 잔재주 없음.
- 예: **Efficient** — 중요한 곳은 밀도 높게, 최소한의 클릭.

## 2. 대상 사용자 & 구동 환경
- 주 사용자 / 맥락:
- 플랫폼: web ☐  mobile web ☐  installable PWA ☐  native ☐
- 밀도 목표: comfortable / compact / spacious

## 3. Color
- 브랜드 / 액센트 근거 (액센트가 전달하는 의미):
- 라이트 & 다크 의도 (다크가 일급 테마인가?):
- 피드백 색상 (success / warning / danger / info) 의도:
- 규칙: 컴포넌트는 원시(primitive) 토큰이 아니라 **시맨틱** 토큰
  (`color.bg.surface`, `color.text.muted`, `color.accent.default`)을 사용한다.

## 4. Typography
- 디스플레이 / 헤딩 폰트 패밀리와 그 이유:
- 본문 폰트 패밀리와 그 이유:
- 스케일 성격 (촘촘하고 기능적 vs. 여유롭고 에디토리얼):
- 기본 줄 높이(line-height) / 한 줄 길이(measure) 의도:

## 5. Space, radius, elevation
- 간격 리듬 (기본 단위와 느낌):
- 모서리 반경 성격 (sharp / soft / pill):
- Elevation/그림자 사용 (flat / layered)과 그림자가 나타나는 시점:

## 6. Motion
- 성격 (snappy / smooth / minimal):
- 기본 지속 시간 & 이징 (모션 토큰 참조):
- `prefers-reduced-motion` 대응 방침:

## 7. Do / Don't
제품의 일관성을 유지하는 구체적인 규칙을 짧게 나열한다.
- Do:
- Don't:

## 8. References
- 토큰 소스: `tokens/` (DTCG)
- 핵심 결정: `docs/adr/`
- 영감 / 출처 자료:
