---
name: completeness
description: >-
  이미 존재하는 웹 프로젝트에서 로딩·에러·빈 상태, 성능 예산(Core Web Vitals), 로딩 속도,
  레이아웃 안정성 디테일을 점검하고 적용 여부를 결정할 때 사용한다.
  네 가지를 다룬다: (1) UX 상태 설계 — 로딩(라우트 리졸버+전환 오버레이 vs 스켈레톤/진행바/
  스피너 중 결정), 에러(유형별 분기), 빈 상태(최초진입/필터결과없음/삭제후), stale-while-revalidate
  표시. (2) 성능 예산 — LCP·CLS·INP 목표치, lab vs field(CrUX) 측정, CI 게이트.
  (3) 로딩 속도 디테일 — 메타프레임워크가 이미 자동 처리하는 항목은 감지해 건너뛰고, 남는 수동
  결정(동적 import, 이미지 lazy-loading·fetchpriority)만 다룬다.
  (4) 레이아웃 안정성 디테일 — scrollbar-gutter, 치수 예약, 폰트 fallback 매칭, View Transitions로
  인한 시프트.
  Keywords: loading state, skeleton screen, spinner, progress bar, error state, empty state,
  route resolver, route loader, fetch-then-render, fetch-on-render, stale-while-revalidate,
  Core Web Vitals, LCP, CLS, INP, performance budget, CrUX, Lighthouse CI, code splitting,
  dynamic import, font loading, font-display, scrollbar-gutter, layout shift, View Transitions,
  production readiness, 완성도 체크, 로딩 스켈레톤, 빈 상태, 성능 예산, 레이아웃 시프트,
  프로덕션 준비.
  프레임워크 비종속.
license: Apache-2.0
metadata:
  author: dev.goraebap
  version: "0.1"
  collection: wellmade-web
---

# completeness

기존 프로젝트를 감지해 로딩·에러·빈 상태, 성능 예산, 로딩 속도, 레이아웃 안정성 디테일의 적용
여부를 결정한다. 산출물은 결정 ADR + 선택된 항목의 구현.

## 언제 활성화하나

- "로딩 화면/스켈레톤을 어떻게 만들지 정해줘", "빈 상태·에러 화면이 없다"
- "성능 예산을 정해줘", "Core Web Vitals 점검해줘", "LCP·CLS·INP 개선"
- "코드 스플리팅 해야 하나", "폰트 로딩 최적화", "레이아웃이 흔들린다"(스크롤바·폰트·이미지)
- "완성도를 점검해줘", "프로덕션 준비됐는지 봐줘" (이 스킬 범위 내 항목만 — PWA·SEO·보안·i18n은
  범위 밖)
- 위 결정·코드에 대한 리뷰

## 운영 메모

필요한 값(성능 목표치, 브레이크포인트 등)이 프로젝트에 있으면 그대로 쓴다. 없으면 진행을
막지 말고 최소 임시값을 정해 값 옆에 `(임시)`로 표시한다. 분업·소관은 언급하지 않는다.

## 규칙 0 — 감지 먼저, 질문은 감지 후에만

다른 두 스킬과 달리 이 스킬은 **처음부터 만들지 않고 이미 있는 프로젝트를 점검**한다. 각 챕터
진입 전에 프로젝트에 이미 있는 것을 감지한다: 라우터 종류와 리졸버/로더 지원 여부, 메타프레임워크
자동화 범위(코드 스플리팅·폰트 최적화), 기존 로딩·에러·빈 상태 컴포넌트, CWV 측정 도구
(Lighthouse CI, `web-vitals` 패키지), `scrollbar-gutter`·이미지 치수 예약 여부. 이미 있는 것은
다시 묻지 않는다. 없는 항목만 "적용할까요?"로 묻고, 선택된 것만 구현한다.

Core Web Vitals 임계값은 아래 수치를 출발점으로 삼되, 확정 전에 web.dev 최신 문서로
재검증한다(메모리에 의존하지 않는다).

---

## 1. UX 상태 설계

### 1.1 로딩 — 두 전략 중 결정

전제가 다른 두 갈래가 있다. 결정 절차·프레임워크별 리졸버/로더 대응표는
`references/loading-strategies.md`.

| 전략 | 전제 |
|------|------|
| 스켈레톤 / 진행바 / 스피너 | 컴포넌트가 마운트된 채로 로딩 상태를 그린다 (fetch-on-render) |
| 라우트 리졸버·로더 + 전환 오버레이(임계 시간) + 루트 캐시 | 라우터가 데이터를 확보한 뒤 컴포넌트를 마운트한다 (fetch-then-render) |

**먼저 묻는다**: 프로젝트 라우터가 라우트 진입 전 데이터를 확보하는 리졸버/로더를 지원하는가?
지원하고 채택 가능하면 fetch-then-render를 기본으로 제안한다. 스켈레톤/스피너를 선호하지 않는
것은 정당한 선호이지, 예외로 취급하지 않는다.

**fetch-then-render 선택 시** [상세: `references/loading-strategies.md`]:
- 전환 오버레이는 임계 시간(150~500ms) 이후에만 표시한다. 임계값보다 빨리 끝나는 전환(캐시
  hit)엔 오버레이를 건너뛴다.
- 루트/전역 캐시로 재방문 시 즉시 표시한다(SWR). 백그라운드 갱신 중엔 상단 얇은 진행바로만
  표시하고, 콘텐츠 영역을 다시 비우지 않는다.
- 이 전략은 **라우트 전환에만** 적용된다. 이미 마운트된 화면 안의 fetch(모달 내 버튼 클릭 등)는
  걸 훅이 없으므로 로컬 로딩 UI가 여전히 필요하다.

**fetch-on-render(스켈레톤/진행바/스피너) 선택 시**: 대기시간 기준 3분기.
- 스켈레톤 — 예상 대기 10초 미만, 콘텐츠 구조를 예측 가능. 치수를 실제 콘텐츠와 반드시 일치시킨다
  (안 그러면 그 자체가 레이아웃 시프트를 유발한다 — 4장과 연결).
- 진행바 — 진행률을 알 수 있는 작업(업로드 등).
- 스피너 — 짧고 불확실한 대기. 최소 표시 지연을 둬서 깜빡임 방지(예: 150ms 미만 완료 시 안 보임).

### 1.2 에러 — 유형별로 분기

"에러 UI 하나"로 뭉치지 않는다. 유형: network offline / 5xx / 403 / 404 / validation /
rate-limit. 유형마다 카피와 액션(재시도·로그인·뒤로가기)이 다르다. fetch-then-render를 쓸 때는
에러가 네비게이션을 막지 않고 페이지가 자체 에러 상태를 그리는 방식을 기본으로 삼는다 —
그래야 "로딩 분기 없음 + 에러 분기만" 구조가 성립한다.

### 1.3 빈 상태 — 세 케이스 구분

- 최초 진입(온보딩) — 이 화면에서 뭘 할 수 있는지 안내하고 첫 액션 CTA를 둔다.
- 필터/검색 결과 없음 — 적용된 조건을 보여주고 초기화 액션을 제공한다.
- 삭제/완료 후 빈 화면 — 완료 톤으로 다음 액션을 제안한다.

### 1.4 stale-while-revalidate 시각 표시

캐시된 오래된 데이터를 먼저 보여주고 백그라운드에서 갱신하는 경우, 갱신 중임을 표시한다(얇은
상단 진행바, 대상 영역의 subtle opacity 등). 사용자가 "이 데이터가 최신인지" 헷갈리지 않게 한다.

## 2. 성능 예산 (Core Web Vitals)

목표치(2026-07 기준 web.dev — 확정 전 최신 정보로 재검증):
- **LCP** — good ≤2.5s / 개선 필요 2.5–4s / poor >4s
- **INP** — good ≤200ms / 개선 필요 200–500ms / poor >500ms
- **CLS** — good ≤0.1 / 개선 필요 0.1–0.25 / poor >0.25

**측정 방법론을 먼저 정한다**: lab(Lighthouse — 로컬/CI에서 재현 가능하지만 실사용자 조건과
다름) vs field(CrUX — 실사용자 75th percentile 기준, Core Web Vitals 통과 여부의 공식 기준).
예산은 field 기준으로 잡고, lab은 회귀 감지용 CI 게이트로 쓴다.

CI 게이트 적용 여부를 묻는다(Lighthouse CI 등). 프로젝트에 이미 있으면 임계값만 맞춘다.

## 3. 로딩 속도 디테일

메타프레임워크가 이미 자동 처리하는 항목은 감지해서 건너뛴다 — 예: Next.js의 라우트 단위 코드
스플리팅, `next/font`의 preload·서브셋·`font-display`는 자동이라 물어볼 필요가 없다. 실제로
결정이 남는 지점만 다룬다:

- below-fold 무거운 컴포넌트의 수동 dynamic import.
- 이미지 lazy-loading — LCP 요소(주로 히어로 이미지)는 절대 lazy 금지.
- `fetchpriority="high"`는 페이지당 1개 원칙(LCP 요소에만 부여).

## 4. 레이아웃 안정성 디테일

- **`scrollbar-gutter: stable`** — 모달/사이드바 개폐, 콘텐츠 높이 변화 시 스크롤바 등장·소멸로
  인한 시프트를 막는다.
- **이미지/embed 치수 예약** — `width`/`height` 속성 또는 `aspect-ratio`.
- **폰트 fallback 매칭**(`size-adjust` 등) — FOIT/FOUT 전환 시 텍스트 크기 점프를 막는다.
- **View Transitions API** — 전환 대상 요소 크기를 고정하지 않으면 새로운 CLS 유발 지점이 된다.
  전환 전후 치수를 명시적으로 맞춘다.

---

## 결정 기록 — ADR

다음 선택은 짧은 ADR로 남긴다: 로딩 전략(fetch-then-render vs fetch-on-render)과 선택 이유,
에러 유형별 분기 정의, 성능 예산 수치와 측정 방법론(lab vs field), CI 게이트 도입 여부, 로딩
속도·레이아웃 안정성 항목 중 적용/보류한 것과 사유. `assets/adr.template.md`를 쓰고 번호를 매겨
`docs/adr/` 또는 `decisions/`에 저장한다. 기각한 선택지도 사유와 함께 적는다.

## 적용 체크리스트

1. [ ] 감지: 라우터의 리졸버/로더 지원 여부, 메타프레임워크 자동화 범위, 기존 로딩·에러·빈 상태,
   CWV 측정 도구 (규칙 0)
2. [ ] 로딩 전략 결정: fetch-then-render vs fetch-on-render (1.1)
3. [ ] fetch-then-render 선택 시: 임계 시간 오버레이 + 루트 캐시(SWR) 설계 (1.1)
4. [ ] fetch-on-render 선택 시: 스켈레톤/진행바/스피너 중 대기시간 기준 선택, 스켈레톤 치수 일치 (1.1)
5. [ ] 에러 유형별 분기 정의 (1.2)
6. [ ] 빈 상태 3케이스 구분 (1.3)
7. [ ] SWR 갱신 시각 표시 여부 (1.4)
8. [ ] LCP·INP·CLS 목표치 + 측정 방법론(lab vs field) 결정 (2장)
9. [ ] CI 게이트 도입 여부 (2장)
10. [ ] 로딩 속도: 메타프레임워크 자동화 항목 제외, 남는 수동 결정만 적용 (3장)
11. [ ] 레이아웃 안정성: scrollbar-gutter, 치수 예약, 폰트 fallback, View Transitions 점검 (4장)
12. [ ] 결정을 ADR로 기록

## 참조 파일 (필요할 때만 읽는다)

- `references/loading-strategies.md` — 1.1 전문: fetch-then-render vs fetch-on-render 결정
  절차, 프레임워크별 리졸버/로더 대응표, 임계 시간 오버레이·루트 캐시 구현 패턴.
- `assets/adr.template.md` — ADR 템플릿.
