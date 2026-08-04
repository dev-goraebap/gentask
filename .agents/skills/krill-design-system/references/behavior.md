# 동작 계약

클래스만으로 만들 수 없는 컴포넌트의 규칙. 구현체는 헤드리스 라이브러리에 맡기고 이 계약을 만족하는지 확인한다.

## 오버레이 공통

- 열릴 때 포커스를 오버레이 안으로 옮기고, 닫힐 때 트리거로 되돌린다
- `Escape`로 닫힌다
- 열려 있는 동안 배경 스크롤을 잠근다
- 바깥 클릭으로 닫힌다 (파괴적 확인 대화상자는 예외)
- 트리거에 `aria-expanded`와 `aria-controls`를 둔다

## Dialog

```html
<div role="dialog" aria-modal="true" aria-labelledby="dlg-title">
  <h2 id="dlg-title">파일을 삭제할까요?</h2>
</div>
```

| 키                  | 동작                   |
| ------------------- | ---------------------- |
| `Escape`            | 닫는다                 |
| `Tab` / `Shift+Tab` | 대화상자 안에서만 순환 |

`aria-modal="true"`만으로는 탭 이동이 막히지 않는다. 포커스 트랩을 별도로 건다.

파괴적 확인이면 열릴 때 **취소 버튼**으로 포커스를 보낸다. 실수로 `Enter`를 눌러도 삭제되지 않는다. 바깥 클릭으로도 닫히지 않게 한다.

### 스크롤 잠금

`overflow: hidden`만 주면 스크롤바가 사라지며 레이아웃이 흔들린다.

```ts
const width = window.innerWidth - document.documentElement.clientWidth;
document.body.style.overflow = 'hidden';
document.body.style.paddingRight = `${width}px`;
```

iOS Safari는 `overflow: hidden`으로 body 스크롤이 멈추지 않는다. `position: fixed`와 스크롤 위치 복원이 필요하다.

### 반응형 전환

| 폭      | 형태                                           |
| ------- | ---------------------------------------------- |
| md 이상 | 화면 중앙 모달, 페이드 + 살짝 확대             |
| md 미만 | 하단 바텀시트(`rounded-t-xl`), 아래에서 올라옴 |

모바일에서는 하드웨어 뒤로가기로 닫혀야 한다. 열 때 `history.pushState`로 항목을 쌓고 `popstate`에서 닫는다.

## Popover · Menu · Tooltip

포지셔닝은 Floating UI로 통일한다.

```ts
import { computePosition, autoUpdate, flip, offset, shift } from '@floating-ui/dom';

const cleanup = autoUpdate(trigger, floating, () => {
  computePosition(trigger, floating, {
    placement: 'bottom-start',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  }).then(({ x, y }) => {
    Object.assign(floating.style, { left: `${x}px`, top: `${y}px` });
  });
});
```

언마운트할 때 `cleanup`을 부른다.

|         | 트리거      | 포커스 이동   | role      |
| ------- | ----------- | ------------- | --------- |
| Popover | 클릭        | 안으로 옮긴다 | `dialog`  |
| Menu    | 클릭        | 첫 항목으로   | `menu`    |
| Tooltip | hover·focus | 옮기지 않는다 | `tooltip` |

### Menu 키보드

| 키                  | 동작                      |
| ------------------- | ------------------------- |
| `Enter` `Space` `↓` | 연다                      |
| `↑` `↓`             | 항목 이동                 |
| `Home` `End`        | 처음·마지막               |
| 문자                | 해당 글자로 시작하는 항목 |
| `Escape`            | 닫고 트리거로 복귀        |
| `Tab`               | 닫고 다음 요소로          |

메뉴 안에서 `Tab`으로 항목 사이를 이동하지 않는다. 화살표만 쓴다.

### Tooltip

- hover와 focus 양쪽에서 뜬다. hover만 걸면 키보드 사용자에게 보이지 않는다
- 여는 데 지연(약 500ms), 닫는 데는 지연 없음
- 툴팁 안에 상호작용 요소를 넣지 않는다
- 툴팁으로만 전달되는 정보는 터치 기기에서 사라진다. 필수 정보는 본문에 둔다
- 트리거에 `aria-describedby`를 둔다. `aria-expanded`는 붙이지 않는다

## Tabs

선택된 탭만 `tabindex="0"`, 나머지는 `-1`이다(roving tabindex). 탭 목록 전체가 탭 정지점 하나를 차지한다.

```html
<div role="tablist" aria-label="설정">
  <button role="tab" id="t1" aria-selected="true" aria-controls="p1" tabindex="0">일반</button>
  <button role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">알림</button>
</div>
<div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">...</div>
```

| 키           | 동작           |
| ------------ | -------------- |
| `←` `→`      | 탭 이동 (수평) |
| `↑` `↓`      | 탭 이동 (수직) |
| `Home` `End` | 처음·마지막    |
| `Tab`        | 패널로 이동    |

이동할 때마다 `tabindex`와 `aria-selected`를 갱신하고 새 탭에 포커스를 준다.

## Accordion

헤더를 heading으로 감싼다. 각 헤더가 개별 탭 정지점이다.

```html
<h3>
  <button aria-expanded="true" aria-controls="sec1" id="hdr1">배송 정보</button>
</h3>
<div role="region" id="sec1" aria-labelledby="hdr1">...</div>
```

닫힌 패널에는 `hidden`이나 `display: none`을 쓴다. `visibility`나 `opacity`만 주면 스크린리더가 읽고 `Tab`으로 도달한다.

### 높이 애니메이션

`height: auto`는 트랜지션되지 않는다. `scrollHeight`를 재서 고정값으로 애니메이션한 뒤 끝나면 `auto`로 되돌린다. 고정 높이를 남기면 내용이 바뀔 때 잘린다.

## Toast

컨테이너를 미리 DOM에 두고 그 안에 토스트를 넣는다. 컨테이너 자체를 나중에 추가하면 스크린리더가 감지하지 못한다.

```html
<div aria-live="polite" aria-atomic="false" class="fixed right-4 bottom-4 flex flex-col gap-2">
  <!-- 토스트 -->
</div>
```

| 종류 | `aria-live` | `role`  |
| ---- | ----------- | ------- |
| 일반 | `polite`    | —       |
| 오류 | `assertive` | `alert` |

| 내용             | 지속 시간                            |
| ---------------- | ------------------------------------ |
| 짧은 확인        | 4초                                  |
| 동작이 딸린 알림 | 8초 이상, hover·focus 중 타이머 정지 |
| 오류             | 자동으로 닫지 않는다                 |

토스트에 포커스를 옮기지 않는다. 동작 버튼이 있으면 `F6` 등으로 도달할 수 있게 한다.

동시에 3개까지만 보이고 나머지는 큐에 둔다. 같은 메시지가 반복되면 카운트를 올린다.

## 모션 감소

`prefers-reduced-motion`에서는 장식적 애니메이션을 멈춘다. 포커스 링처럼 상태 변화를 알리는 전환은 유지한다.
