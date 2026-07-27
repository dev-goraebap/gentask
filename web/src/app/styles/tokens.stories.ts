import type { Meta, StoryObj } from '@storybook/angular-vite';

/**
 * 시맨틱 토큰의 참조 페이지. tokens.css와 나란히 두는 이유는 값이 바뀌면
 * 이 화면이 같이 바뀌어야 하기 때문이다 — 떨어져 있으면 갱신을 잊는다.
 *
 * 두 모드를 **나란히** 보여준다. 한 번에 하나만 보이면 한쪽 모드가 깨진
 * 것을 늦게 발견한다. data-theme을 하위 트리에 걸 수 있게 만들어 둔 덕에
 * 한 화면에 둘을 띄울 수 있다.
 *
 * 여기서 쓰는 클래스는 전부 @theme이 생성한 유틸리티다.
 */
const meta: Meta = {
  title: 'Foundation/토큰',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

/** 한 모드의 캔버스를 만든다. data-theme이 color-scheme을 바꾸고
 *  light-dark()가 그것을 따라간다. */
const 모드 = (테마: 'light' | 'dark', 내용: string) => `
  <div data-theme="${테마}" class="flex-1 bg-background p-8">
    <div class="mb-8 flex items-center gap-3">
      <span class="text-label uppercase text-muted">${테마 === 'light' ? '라이트' : '다크'}</span>
      <span class="h-px flex-1 bg-line"></span>
    </div>
    <div class="flex flex-col gap-12">${내용}</div>
  </div>
`;

const 나란히 = (내용: string) => `
  <div class="flex min-h-screen flex-col lg:flex-row">
    ${모드('light', 내용)}${모드('dark', 내용)}
  </div>
`;

const 절 = (제목: string, 내용: string) => `
  <section class="flex flex-col gap-5">
    <h2 class="text-label uppercase text-subtle">${제목}</h2>
    ${내용}
  </section>
`;

const 견본 = (이름: string, 클래스: string, 설명: string) => `
  <div class="flex items-center gap-3">
    <div class="size-10 shrink-0 rounded-tight border border-line ${클래스}"></div>
    <div class="min-w-0">
      <div class="font-mono text-body-sm text-foreground">${이름}</div>
      <div class="text-body-sm text-muted">${설명}</div>
    </div>
  </div>
`;

const 색상내용 = `
  ${절(
    '표면 — 라이트는 그림자가, 다크는 색이 층위를 만든다',
    `<div class="grid gap-4 sm:grid-cols-2">
      ${견본('background', 'bg-background', '페이지 캔버스')}
      ${견본('surface', 'bg-surface', '카드 · 입력 필드')}
      ${견본('elevated', 'bg-elevated', '모달 · 팝오버')}
      ${견본('overlay', 'bg-overlay', '배경 딤')}
    </div>`,
  )}
  ${절(
    '전경',
    `<div class="grid gap-4 sm:grid-cols-2">
      ${견본('foreground', 'bg-foreground', '제목 · 본문 — AA 통과')}
      ${견본('muted', 'bg-muted', '보조 텍스트 — AA 통과')}
      ${견본('subtle', 'bg-subtle', '비활성 · 메타 — UI 기준만. 본문 금지')}
    </div>`,
  )}
  ${절(
    '경계선 · 액센트',
    `<div class="grid gap-4 sm:grid-cols-2">
      ${견본('line', 'bg-line', '기본 헤어라인')}
      ${견본('line-strong', 'bg-line-strong', '선택 행 등 강조')}
      ${견본('accent', 'bg-accent', '채움 — 흰 텍스트가 AA를 넘는 단계')}
      ${견본('accent-ink', 'bg-accent-ink', '잉크 — 링크 · 아이콘')}
      ${견본('accent-soft', 'bg-accent-soft', '선택 상태 배경')}
    </div>`,
  )}
  ${절(
    '의도 — 기본형은 텍스트용, soft는 배경용',
    `<div class="grid gap-4 sm:grid-cols-2">
      ${견본('success', 'bg-success', '완료')}
      ${견본('success-soft', 'bg-success-soft', '완료 배너 배경')}
      ${견본('warning', 'bg-warning', '주의')}
      ${견본('warning-soft', 'bg-warning-soft', '주의 배너 배경')}
      ${견본('info', 'bg-info', '안내')}
      ${견본('info-soft', 'bg-info-soft', '안내 배너 배경')}
      ${견본('danger', 'bg-danger', '오류 · 파괴적 동작')}
      ${견본('danger-soft', 'bg-danger-soft', '오류 배너 배경')}
    </div>`,
  )}
  ${절(
    '실사용 — 대비를 눈으로 확인한다',
    `<div class="flex flex-col gap-3">
      <div class="rounded-surface border border-line bg-surface p-5">
        <p class="text-title text-foreground">카드 제목</p>
        <p class="mt-1 text-body text-muted">보조 설명이 이 대비로 읽힙니다.</p>
        <p class="mt-1 text-body-sm text-subtle">메타데이터는 여기까지만 낮춥니다.</p>
        <div class="mt-4 flex items-center gap-3">
          <span class="rounded-control bg-accent px-4 py-2 text-body-sm font-medium text-on-accent">주 동작</span>
          <span class="text-body-sm text-accent-ink">링크 텍스트</span>
        </div>
      </div>
      <div class="rounded-control border border-line bg-danger-soft px-4 py-3">
        <p class="text-body-sm text-danger">오류 메시지가 soft 배경 위에 얹힙니다.</p>
      </div>
    </div>`,
  )}
`;

export const 색상: StoryObj = {
  render: () => ({ template: 나란히(색상내용) }),
};

const 타입내용 = `
  ${절(
    '타입 스케일 — 크기가 아니라 역할로 부른다',
    `<div class="flex flex-col gap-6">
      <div><div class="text-label uppercase text-subtle">display</div><p class="text-display text-foreground">정보는 빛이다</p></div>
      <div><div class="text-label uppercase text-subtle">headline-lg</div><p class="text-headline-lg text-foreground">페이지 제목</p></div>
      <div><div class="text-label uppercase text-subtle">headline-md</div><p class="text-headline-md text-foreground">절 제목</p></div>
      <div><div class="text-label uppercase text-subtle">title</div><p class="text-title text-foreground">카드 제목</p></div>
      <div>
        <div class="text-label uppercase text-subtle">body</div>
        <p class="max-w-prose text-body text-foreground">
          본문 기본 크기입니다. 한글과 라틴이 한 서체(Pretendard)로 덮이는지 확인하세요 —
          Latin mixed inline 처럼 섞였을 때 굵기와 리듬이 어긋나지 않아야 합니다.
        </p>
      </div>
      <div><div class="text-label uppercase text-subtle">body-sm</div><p class="text-body-sm text-muted">보조 설명 · 힌트 · 캡션</p></div>
      <div><div class="text-label uppercase text-subtle">label</div><p class="text-label uppercase text-muted">폼 라벨 · FORM LABEL</p></div>
      <div><div class="text-label uppercase text-subtle">mono (시스템 스택)</div><p class="font-mono text-mono text-foreground">const token = 'value';</p></div>
      <div><div class="text-label uppercase text-subtle">metric</div><p class="text-metric text-foreground">1,284</p></div>
    </div>`,
  )}
`;

export const 타입스케일: StoryObj = {
  render: () => ({ template: 나란히(타입내용) }),
};

const 형태내용 = `
  ${절(
    '반경 — 역할별로 고정한다',
    `<div class="grid gap-4 sm:grid-cols-2">
      ${[
        'tight · 6px|체크박스',
        'control · 10px|버튼 · 입력',
        'surface · 16px|카드',
        'panel · 24px|모달 · 시트',
        'pill|배지 · 스위치',
      ]
        .map((v) => {
          const [n, d] = v.split('|');
          const cls = 'rounded-' + n.split(' ')[0];
          return `<div class="flex items-center gap-3">
            <div class="h-10 w-16 shrink-0 border border-line bg-surface ${cls}"></div>
            <div><div class="font-mono text-body-sm text-foreground">${n}</div><div class="text-body-sm text-muted">${d}</div></div>
          </div>`;
        })
        .join('')}
    </div>`,
  )}
  ${절(
    '깊이 — 두 모드가 다른 수단을 쓴다',
    `<div class="grid gap-5 sm:grid-cols-3">
      <div class="flex flex-col gap-2">
        <div class="h-20 rounded-surface bg-elevated shadow-raised"></div>
        <span class="font-mono text-body-sm text-muted">raised</span>
      </div>
      <div class="flex flex-col gap-2">
        <div class="h-20 rounded-surface bg-elevated shadow-floating"></div>
        <span class="font-mono text-body-sm text-muted">floating</span>
      </div>
      <div class="flex flex-col gap-2">
        <div class="h-20 rounded-panel bg-elevated shadow-modal"></div>
        <span class="font-mono text-body-sm text-muted">modal</span>
      </div>
    </div>`,
  )}
  ${절(
    '포커스 링 — 컴포넌트가 바꾸지 않는다',
    `<div class="flex flex-wrap items-center gap-4">
      <div class="rounded-control border border-line bg-surface px-4 py-2 text-body text-foreground" style="box-shadow: var(--focus-ring)">
        :focus-visible
      </div>
      <span class="text-body-sm text-subtle">키보드 이동에만 나타난다</span>
    </div>`,
  )}
`;

export const 형태와깊이: StoryObj = {
  render: () => ({ template: 나란히(형태내용) }),
};
