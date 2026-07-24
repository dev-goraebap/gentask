# 디자인 토큰 & 톤 & 매너

디자인 언어는 *반드시* 프레임워크에 종속되지 않아야 하는 부분입니다. 토큰은
계약(contract)이며, 모든 프레임워크가 동일한 값을 소비합니다. 이 계층을 제대로
잡으면 테마, 다크 모드, 브랜드 변경이 저렴해집니다.

## 목차
1. 인테이크 — 톤 & 매너는 어디에서 오는가
2. 3단계 토큰 아키텍처
3. DTCG 포맷 (2026 표준)
4. 빌드 파이프라인 (토큰 → 프레임워크)
5. 테마 & 다크 모드
6. 산출물: 무엇을 전달할 것인가

---

## 1. 인테이크 — 톤 & 매너 확립하기

브랜드를 무(無)에서 발명하지 마세요. 사용자에게 어떤 소스를 가지고 있는지 묻고,
제공하는 무엇이든 그것으로부터 추출하세요:

| 소스 | 추출 방법 |
| --- | --- |
| 산문 설명 ("차분하고, 에디토리얼하며, 여백이 많은") | 형용사를 구체적인 값으로 번역: 밀도, 대비, 반경(radius), 모션 속도. |
| 기존 `DESIGN.md` | 읽어서 진실의 원천(source of truth)으로 취급하고 코드와 대조해 조정. |
| 레퍼런스 웹사이트 | 해당 페이지를 `web_fetch`하여 CSS 커스텀 프로퍼티, 폰트 스택, 간격 리듬, 색상 사용을 읽기. |
| 스크린샷 / PNG / Figma 익스포트 | 이미지를 읽기: 팔레트를 샘플링하고, 타입 스케일을 추론하며, 간격 밀도와 무드를 파악. |
| 경쟁사 / 영감 링크 | 픽셀 복사가 아닌 방향성 있는 무드로 활용. |

사용자가 형용사만 제공한다면, 구체적인 해석을 제안하고 전체 세트를 생성하기 전에
확인을 받으세요. 레퍼런스 사이트나 이미지를 제공한다면, 실제 값을 추출해 확인을
위해 다시 보여주세요.

**무드 → 값으로 번역하세요.** 당신이 만들고 있는 매핑의 예시:
- "에디토리얼 / 차분함" → 더 큰 간격 스케일, 낮은 색상 채도, 세리프 또는
  휴머니스트 산세리프 디스플레이, 느린 모션(200–300 ms), 넉넉한 line-height.
- "에너제틱 / 장난스러움" → 선명한 액센트, 더 큰 반경, 빠르고 경쾌한 모션
  (120–180 ms), 더 빡빡한 밀도.
- "엔터프라이즈 / 고밀도" → 컴팩트한 간격, 절제된 팔레트, 작은 반경,
  최소한의 모션, 높은 정보 밀도.

## 2. 3단계 토큰 아키텍처

이것은 디자인 시스템에서 단일 최고 ROI 의사결정입니다. 세 단계를 사용하세요:

1. **Primitive (또는 core / global)** — 원재료. 전체 팔레트와
   원시 스케일, 브랜드 중립적 이름: `color.blue.500`, `space.4`, `font.size.300`.
   이들은 값이지, 사용에 대한 결정이 아닙니다.
2. **Semantic (또는 alias / role)** — 외형이 아닌 의미:
   `color.bg.surface`, `color.bg.surface.raised`, `color.text.default`,
   `color.text.muted`, `color.border.default`, `color.accent.default`,
   `space.inset.md`, `radius.control`. Semantic 토큰은 primitive를 *참조*합니다.
3. **Component (선택)** — 컴포넌트가 분기해야 할 때만 사용하는 컴포넌트별 오버라이드:
   `button.primary.bg`, `card.padding`. 대부분의 프로젝트는 초기에 이 단계를
   건너뛸 수 있습니다.

**모든 것을 작동하게 만드는 규칙:** 컴포넌트는 **semantic** 토큰을 소비하며,
primitive는 절대 소비하지 않습니다. `color.blue.500`을 직접 읽는 `Button`은 다크
모드와 리브랜딩을 여러 달짜리 프로젝트로 만듭니다. `color.accent.default`를 읽는
`Button`은 semantic 계층이 재매핑될 때 다크 모드를 공짜로 얻습니다.

다뤄야 할 토큰 카테고리: **color** (bg, text, border, accent, feedback:
success/warning/danger/info), **spacing** (단일 스케일 + semantic inset/gap),
**typography** (폰트 패밀리, 사이즈 스케일, 굵기, line-height, letter-spacing,
복합 텍스트 스타일), **radius**, **border width**, **shadow/elevation**,
**z-index layer**, **motion** (duration, easing), **breakpoint**.

## 3. DTCG 포맷 — 상호운용 가능한 표준

토큰을 **W3C Design Tokens Community Group (DTCG)** JSON 포맷으로 작성하세요. 2026년
기준으로 이것은 사실상의 교환 포맷입니다: Style Dictionary, Tokens Studio,
Figma variables, 그리고 AI 디자인 도구가 모두 이를 읽으므로, 도구별 변환기를
피할 수 있습니다.

포맷의 규칙:
- 토큰은 `$value`를 가진 임의의 객체입니다. 또한 `$type`을 받습니다
  (`color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`,
  `shadow`, `typography`, `number`, …).
- `$`로 시작하는 것은 무엇이든 예약된 메타데이터입니다 (`$value`, `$type`,
  `$description`, `$extensions`, `$deprecated`). 그 외 모든 것은 그룹입니다.
- 참조는 중괄호 별칭을 사용합니다: `"$value": "{color.blue.500}"`. 이것이 semantic
  단계가 primitive 단계를 가리키고 변환을 거쳐도 살아남는 방식입니다.

최소 예시:

```json
{
  "color": {
    "blue": { "500": { "$type": "color", "$value": "#2563eb" } },
    "bg":    { "surface": { "$type": "color", "$value": "{color.white}" } },
    "accent":{ "default": { "$type": "color", "$value": "{color.blue.500}" } }
  }
}
```

더 충실한 시작용 파일은 `assets/tokens.dtcg.example.json`에 있습니다.

유의할 점 (이 스펙은 성숙한 초안이며, 모든 부분이 확정된 것은 아닙니다):
**modes** (라이트/다크, 브랜드 변형)는 아직 하나의 정립된 관례가 없습니다 —
도구들은 `$extensions`, 별도 파일, 또는 테마 세트를 사용합니다; 하나를 골라
일관되게 유지하세요. **수학 표현식** (`space.4 * 2`)은 네이티브가 아닙니다; 빌드
시점에 해석하세요. 기본 토큰 파일은 단순하게 유지하고, 강제될 때만 `$extensions`에
기대세요.

## 4. 빌드 파이프라인 — 토큰에서 프레임워크로

토큰은 스타일링 솔루션이 소비할 무언가로 변환되기 전까지는 비활성 JSON입니다.
**Style Dictionary** (가장 확립된 변환기; v4+는 DTCG를 읽음)를 사용해 감지된
스타일링 솔루션에 맞는 출력물을 생성하세요:

- **Tailwind** → CSS 커스텀 프로퍼티(그리고/또는 theme 객체)를 내보내고 이를
  Tailwind theme에 연결하여 유틸리티가 토큰에 매핑되도록 합니다.
- **Plain CSS / CSS Modules / vanilla-extract** → `:root`의 CSS 커스텀 프로퍼티
  더하기 타입이 지정된 TS 익스포트.
- **CSS-in-JS / Panda / UnoCSS** → JS/TS theme 객체.
- **멀티 플랫폼 (네이티브 포함)** → Style Dictionary는 동일한 소스로부터
  Swift/Kotlin을 추가로 내보낼 수 있습니다.

파이프라인을 연결하기 전에 현재 Style Dictionary 메이저 버전과 그 DTCG 포맷 지원
수준을 확인하세요 (DTCG 지원은 버전마다 발전해 왔습니다).
팀이 이미 Figma에서 Tokens Studio를 사용한다면, 그 익스포트가 *곧* DTCG입니다 —
빌드에 곧바로 투입하세요.

공유 디자인 시스템에 추천할 만한 전형적인 CI 흐름: 토큰 JSON을 DTCG 스키마에 대해
검증하고 린트(고아 토큰 없음, 누락된 `$type` 없음) → Style Dictionary로 빌드 →
(선택적으로) 토큰/프리뷰 표면 배포 → 앱이 소비하는 버전 관리된 `@scope/tokens`
패키지 발행.

## 5. 테마 & 다크 모드

컴포넌트가 semantic 토큰을 소비하기 때문에, 테마는 단지 semantic → primitive의
다른 매핑일 뿐입니다. 라이트/다크(그리고 임의의 브랜드 테마)는 semantic 계층을
교체하여 구현하세요 — 일반적으로 `data-theme` 속성이나 `.dark` 클래스가 다른 CSS
커스텀 프로퍼티 값 세트를 토글하는 방식입니다. 테마마다 컴포넌트를 포크하지 마세요.

## 6. 산출물 — 파일로 전달하기

다음을 (인라인 스니펫이 아닌) 실제 파일로 생성하세요:
- `tokens/` DTCG 소스 (최소한 primitive + semantic 단계).
- 감지된 스타일링 솔루션에 대한 생성된 출력물 (CSS vars / Tailwind
  theme / TS).
- `DESIGN.md` — 토큰 뒤에 있는 서사 (`assets/DESIGN.template.md` 사용).
  토큰은 *무엇*을 인코딩하고, DESIGN.md는 *왜*를 인코딩합니다. 이것이 미래의
  기여자(그리고 AI 도구)를 브랜드에 부합하게 유지하는 요소입니다.

토큰 아키텍처 결정을 ADR로 기록하세요.
