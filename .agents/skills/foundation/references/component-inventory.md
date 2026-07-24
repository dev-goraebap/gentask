# 기본 컴포넌트 인벤토리 (무엇을 만들지 먼저 제시)

사용자는 보통 "버튼·입력 정도"만 떠올리고 체크박스·라디오·스위치·검색·페이지네이션·
툴팁·스켈레톤처럼 **흔하지만 빠지기 쉬운** 컴포넌트를 나중에야 발견한다. 그래서
컴포넌트 작업을 시작할 때 이 인벤토리를 **먼저 제시하고 스코프를 합의**하라 — 사용자가 하나씩
빠진 걸 짚게 두지 말고, 누락 가능성이 높은 것을 능동적으로 짚어줘라.

> 이건 "전부 만들라"는 목록이 아니다. 후보 체크리스트다. 등급으로 우선순위를 주되,
> 실제 채택은 앱의 필요로 정한다(Pages First 원칙). 한 번에 다 만들지 말고, 쓰는 것부터.

## 등급

- **[필수]** 거의 모든 앱이 쓴다. 빠지면 곧 아쉬워진다 — 기본 후보로 제안하라.
- **[일반]** 자주 쓰인다. 도메인에 따라 매우 흔함 — 누락되면 명시적으로 물어보라.
- **[선택]** 특정 요구에서만. 필요가 확인될 때 만든다.

## 그룹별 목록

**액션**
- Button [필수] — 변형(primary/secondary/tertiary/danger) + 크기(sm/md/lg) + disabled/loading
- Icon button [필수] · Link [필수]
- Segmented control / Button group [일반]

**폼 · 입력**
- Field 래퍼(라벨·도움말·에러) [필수] — 입력류의 공통 크롬
- Text input [필수] · Textarea [필수]
- Select [필수] · Combobox/Autocomplete [일반]
- Checkbox [필수] · Radio group [필수] · Switch/Toggle [필수]
- Search [일반] · Slider/Range [일반] · Number/Stepper [선택]
- Date picker [일반] · Date range [일반]
- File upload [선택] · Tag input [선택]
- 폼 검증 패턴(에러 표시·메시지) [필수]

**데이터 표시**
- Table [필수] · List / Description list [일반]
- Card [필수] · Chip/Badge/Tag [필수] · Avatar [일반]
- Stat/Metric tile [일반]
- Tooltip [필수] · Accordion/Disclosure [일반]
- Empty state [일반] · Skeleton/Loading placeholder [일반]

**피드백 · 상태**
- Toast/Notification [필수] · Dialog/Modal [필수]
- Alert / 인라인 배너 [일반] · Drawer/Sheet [일반]
- Spinner [필수] · Progress bar [일반] · Popover [일반]

**내비게이션**
- Menu/Dropdown [필수] · Tabs [필수]
- Sidebar / 앱 내비 [필수] · 하단 탭 바(모바일) [일반]
- Breadcrumb [일반] · Pagination [일반] · Command palette [선택]

**레이아웃 프리미티브**
- Divider/Separator [필수] · Scroll area [선택]
- (Stack/Grid는 보통 유틸리티로, 컴포넌트로는 선택)

## 기본 인벤토리에서 빼는 것 — 도메인 / 앱-레벨

다음은 디자인 시스템의 **기본 프리미티브가 아니다.** 앱의 도메인 요구로 그 앱에서
만들고, 재사용이 확인되면 그때 올린다(Pages First). 기본 제안 목록에 넣지 마라:

- **Calendar / Scheduler**(월간 일정·이벤트 뷰) — 날짜 *선택*은 Date picker가 담당.
- Kanban / 보드, Charts/Graphs, Rich-text editor, Map, 고급 Data-grid(가상화·피벗),
  Gantt, Tree view, 파일 탐색기 등.

## 운영 — 어떻게 제시하나

1. 컴포넌트 작업 진입 시 위 [필수] + 도메인에 맞는 [일반]을 **묶음으로 제안**하고, 무엇을 스코프에
   넣을지 확인하라(대화형 질문 도구 적합). 빠지기 쉬운 것(라디오·스위치·툴팁·스켈레톤·
   페이지네이션·검색)을 특히 짚어라.
2. 각 컴포넌트는 **동작 조달**(어떤 라이브러리/유틸리티에서 동작을 가져올지)을 고려하라.
3. 한 번에 다 만들지 말고, **쓰는 것부터** 만들고 인벤토리를 남은 후보 체크리스트로 둬라.
4. 스코프(무엇을 넣고 뺐는지)를 짧게 기록하라 — 나중에 "이건 왜 없지"를 막는다.
