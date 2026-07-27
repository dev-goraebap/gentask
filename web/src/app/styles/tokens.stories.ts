import type { Meta, StoryObj } from '@storybook/angular-vite';

/**
 * 시맨틱 토큰의 참조 페이지. tokens.css와 나란히 두는 이유는 값이 바뀌면
 * 이 화면이 같이 바뀌어야 하기 때문이다 — 떨어져 있으면 갱신을 잊는다.
 *
 * 여기서 쓰는 클래스는 전부 @theme이 생성한 유틸리티다. 화면이 비어
 * 보이거나 색이 안 나오면 토큰 선언이 유틸리티로 이어지지 않은 것이다.
 */
const meta: Meta = {
  title: 'Foundation/토큰',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

const 색상견본 = (이름: string, 클래스: string, 설명: string) => `
  <div class="flex items-center gap-4">
    <div class="size-12 shrink-0 rounded-tight border border-line ${클래스}"></div>
    <div class="min-w-0">
      <div class="text-body font-mono text-foreground">${이름}</div>
      <div class="text-body-sm text-muted">${설명}</div>
    </div>
  </div>
`;

const 절 = (제목: string, 내용: string) => `
  <section class="flex flex-col gap-6">
    <h2 class="text-label uppercase text-muted">${제목}</h2>
    ${내용}
  </section>
`;

const 감싸기 = (내용: string) => `
  <div class="min-h-screen bg-background p-10">
    <div class="mx-auto flex max-w-5xl flex-col gap-16">${내용}</div>
  </div>
`;

export const 색상: StoryObj = {
  render: () => ({
    template: 감싸기(`
      ${절(
        '표면 · 3단',
        `<div class="grid gap-6 sm:grid-cols-2">
          ${색상견본('bg-background', 'bg-background', '페이지 캔버스')}
          ${색상견본('bg-surface', 'bg-surface', '카드 · 입력 필드')}
          ${색상견본('bg-elevated', 'bg-elevated', '모달 · 팝오버')}
          ${색상견본('bg-overlay', 'bg-overlay', '배경 딤 처리')}
        </div>`,
      )}
      ${절(
        '전경',
        `<div class="grid gap-6 sm:grid-cols-2">
          ${색상견본('text-foreground', 'bg-foreground', '제목 · 본문')}
          ${색상견본('text-muted', 'bg-muted', '보조 텍스트 · 라벨')}
          ${색상견본('text-subtle', 'bg-subtle', '비활성 · 메타데이터. 본문에 쓰지 않는다')}
        </div>`,
      )}
      ${절(
        '경계선',
        `<div class="grid gap-6 sm:grid-cols-2">
          ${색상견본('border-line', 'bg-line', '기본 헤어라인 1px')}
          ${색상견본('border-line-strong', 'bg-line-strong', '선택된 행 등 비포커스 강조')}
        </div>`,
      )}
      ${절(
        '액센트',
        `<div class="grid gap-6 sm:grid-cols-2">
          ${색상견본('bg-accent', 'bg-accent', '주 동작')}
          ${색상견본('bg-accent-hover', 'bg-accent-hover', '호버')}
          ${색상견본('bg-accent-pressed', 'bg-accent-pressed', '누름')}
          ${색상견본('bg-accent-soft', 'bg-accent-soft', '선택 상태 배경')}
        </div>`,
      )}
      ${절(
        '의도 — soft는 배경용, 기본형은 텍스트·아이콘용',
        `<div class="grid gap-6 sm:grid-cols-2">
          ${색상견본('success', 'bg-success', '완료 · 긍정 지표')}
          ${색상견본('success-soft', 'bg-success-soft', '완료 배너 배경')}
          ${색상견본('warning', 'bg-warning', '주의')}
          ${색상견본('warning-soft', 'bg-warning-soft', '주의 배너 배경')}
          ${색상견본('info', 'bg-info', '안내')}
          ${색상견본('info-soft', 'bg-info-soft', '안내 배너 배경')}
          ${색상견본('danger', 'bg-danger', '오류 · 파괴적 동작')}
          ${색상견본('danger-soft', 'bg-danger-soft', '오류 배너 배경')}
        </div>`,
      )}
    `),
  }),
};

export const 타입스케일: StoryObj = {
  render: () => ({
    template: 감싸기(`
      ${절(
        '타입 스케일 — 크기가 아니라 역할로 부른다',
        `<div class="flex flex-col gap-8">
          <div>
            <div class="text-label uppercase text-subtle">text-display</div>
            <p class="text-display text-foreground">정보는 빛이다</p>
          </div>
          <div>
            <div class="text-label uppercase text-subtle">text-headline-lg</div>
            <p class="text-headline-lg text-foreground">페이지 제목</p>
          </div>
          <div>
            <div class="text-label uppercase text-subtle">text-headline-md</div>
            <p class="text-headline-md text-foreground">절 제목</p>
          </div>
          <div>
            <div class="text-label uppercase text-subtle">text-title</div>
            <p class="text-title text-foreground">카드 제목</p>
          </div>
          <div>
            <div class="text-label uppercase text-subtle">text-body</div>
            <p class="max-w-prose text-body text-foreground">
              본문 기본 크기다. 한 줄의 길이가 너무 길어지지 않게 컨테이너 폭을 제한한다.
              읽는 사람의 눈이 줄 끝에서 다음 줄 머리를 찾지 못하면 그것만으로 피로해진다.
            </p>
          </div>
          <div>
            <div class="text-label uppercase text-subtle">text-body-sm</div>
            <p class="text-body-sm text-muted">보조 설명 · 힌트 · 캡션</p>
          </div>
          <div>
            <div class="text-label uppercase text-subtle">text-label</div>
            <p class="text-label uppercase text-muted">폼 라벨</p>
          </div>
          <div>
            <div class="text-label uppercase text-subtle">text-mono</div>
            <p class="font-mono text-mono text-foreground">const token = 'value';</p>
          </div>
          <div>
            <div class="text-label uppercase text-subtle">text-metric</div>
            <p class="text-metric text-foreground">1,284</p>
          </div>
        </div>`,
      )}
    `),
  }),
};

export const 형태와깊이: StoryObj = {
  render: () => ({
    template: 감싸기(`
      ${절(
        '반경 — 역할별로 고정한다',
        `<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div class="flex flex-col gap-3">
            <div class="h-20 rounded-tight bg-surface border border-line"></div>
            <span class="text-body-sm font-mono text-muted">rounded-tight · 6px</span>
            <span class="text-body-sm text-subtle">체크박스 · 작은 표식</span>
          </div>
          <div class="flex flex-col gap-3">
            <div class="h-20 rounded-control bg-surface border border-line"></div>
            <span class="text-body-sm font-mono text-muted">rounded-control · 10px</span>
            <span class="text-body-sm text-subtle">버튼 · 입력 · 셀렉트</span>
          </div>
          <div class="flex flex-col gap-3">
            <div class="h-20 rounded-surface bg-surface border border-line"></div>
            <span class="text-body-sm font-mono text-muted">rounded-surface · 16px</span>
            <span class="text-body-sm text-subtle">카드 · 필드셋</span>
          </div>
          <div class="flex flex-col gap-3">
            <div class="h-20 rounded-panel bg-surface border border-line"></div>
            <span class="text-body-sm font-mono text-muted">rounded-panel · 24px</span>
            <span class="text-body-sm text-subtle">모달 · 시트</span>
          </div>
          <div class="flex flex-col gap-3">
            <div class="h-20 rounded-pill bg-surface border border-line"></div>
            <span class="text-body-sm font-mono text-muted">rounded-pill</span>
            <span class="text-body-sm text-subtle">배지 · 칩 · 스위치</span>
          </div>
        </div>`,
      )}
      ${절(
        '깊이 — 다크 테마에서는 안쪽 하이라이트가 함께 필요하다',
        `<div class="grid gap-8 sm:grid-cols-3">
          <div class="flex flex-col gap-3">
            <div class="h-24 rounded-surface bg-elevated shadow-raised"></div>
            <span class="text-body-sm font-mono text-muted">shadow-raised</span>
            <span class="text-body-sm text-subtle">버튼 · 정적 카드</span>
          </div>
          <div class="flex flex-col gap-3">
            <div class="h-24 rounded-surface bg-elevated shadow-floating"></div>
            <span class="text-body-sm font-mono text-muted">shadow-floating</span>
            <span class="text-body-sm text-subtle">드롭다운 · 팝오버</span>
          </div>
          <div class="flex flex-col gap-3">
            <div class="h-24 rounded-panel bg-elevated shadow-modal"></div>
            <span class="text-body-sm font-mono text-muted">shadow-modal</span>
            <span class="text-body-sm text-subtle">모달 · 시트</span>
          </div>
        </div>`,
      )}
      ${절(
        '포커스 링 — 컴포넌트가 바꾸지 않는다',
        `<div class="flex flex-wrap items-center gap-6">
          <div class="rounded-control bg-surface px-5 py-3 text-body text-foreground border border-line" style="box-shadow: var(--focus-ring)">
            :focus-visible 상태
          </div>
          <span class="text-body-sm text-subtle">키보드 이동에만 나타난다(마우스 클릭에는 나타나지 않는다)</span>
        </div>`,
      )}
    `),
  }),
};
