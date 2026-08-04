import type { Meta, StoryObj } from '@storybook/angular-vite';

/**
 * 디자인 토큰 참조 화면 — Krill (결정-0024). krill.css와 나란히 두는 이유는
 * 값이 바뀌면 이 화면이 같이 바뀌어야 하기 때문이다 — 떨어져 있으면 갱신을 잊는다.
 *
 * 두 모드를 **나란히** 보여준다. 한 번에 하나만 보이면 한쪽 모드가 깨진 것을
 * 늦게 발견한다.
 *
 * 라이트가 기본이고 `.dark` 클래스가 색 토큰만 덮어쓴다. 그래서 라이트 패널은
 * 클래스가 없고 다크 패널에만 `dark`를 건다 — Storybook 프리뷰 루트에는
 * `.dark`가 붙지 않으므로 이 배치가 성립한다.
 *
 * 여기서 쓰는 클래스는 전부 krill.css가 생성한 유틸리티다. 이 화면이 깨지면
 * 토큰이 사라졌거나 이름이 바뀐 것이다.
 */
const meta: Meta = {
  title: 'Foundation/토큰',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

const 모드 = (테마: 'light' | 'dark', 내용: string) => `
  <div class="${테마 === 'dark' ? 'dark ' : ''}flex-1 bg-background p-8">
    <div class="mb-8 flex items-center gap-3">
      <span class="t-label-sm">${테마 === 'dark' ? '다크' : '라이트'}</span>
      <span class="h-px flex-1 bg-border"></span>
    </div>
    <div class="flex flex-col gap-10">${내용}</div>
  </div>
`;

const 나란히 = (내용: string) => ({
  template: `<div class="flex min-h-screen flex-col lg:flex-row">${모드('light', 내용)}${모드('dark', 내용)}</div>`,
});

const 절 = (제목: string, 내용: string) => `
  <section class="flex flex-col gap-3">
    <h2 class="t-label-sm text-fg-faint">${제목}</h2>
    ${내용}
  </section>
`;

/** 색 견본 한 칸. 채움을 보여주고 이름과 쓰임을 붙인다. */
const 견본 = (이름: string, 클래스: string, 설명: string) => `
  <div class="flex flex-col gap-1.5">
    <div class="h-14 rounded-md border border-border ${클래스}"></div>
    <div class="font-mono text-[0.8125rem] text-fg">${이름}</div>
    <div class="t-body-sm text-fg-muted">${설명}</div>
  </div>
`;

export const 색: StoryObj = {
  render: () =>
    나란히(`
      ${절(
        '표면 3단 — 올라갈수록 앞에 있다',
        `<div class="grid max-w-3xl gap-4 sm:grid-cols-4">
          ${견본('background', 'bg-background', '캔버스')}
          ${견본('surface', 'bg-surface', '컴포넌트 면')}
          ${견본('elevated', 'bg-elevated', '떠 있는 면')}
          ${견본('muted', 'bg-muted', 'hover · 비활성 채움')}
        </div>`,
      )}
      ${절(
        '보더 — 선이 구조를 그린다',
        `<div class="grid max-w-3xl gap-4 sm:grid-cols-3">
          ${견본('border', 'bg-border', '장식선 — 면을 가른다')}
          ${견본('border-strong', 'bg-border-strong', '강조된 장식선')}
          ${견본('border-control', 'bg-border-control', '폼 컨트롤 경계 — 3:1을 만족한다')}
        </div>`,
      )}
      ${절(
        '전경 — 아래로 갈수록 대비가 낮아진다',
        `<div class="grid max-w-3xl gap-4 sm:grid-cols-3">
          ${견본('fg', 'bg-fg', '제목 · 본문')}
          ${견본('fg-muted', 'bg-fg-muted', '보조 텍스트 · 라벨')}
          ${견본('fg-faint', 'bg-fg-faint', '플레이스홀더 · 캡션')}
        </div>`,
      )}
      ${절(
        '브랜드',
        `<div class="grid max-w-3xl gap-4 sm:grid-cols-4">
          ${견본('primary', 'bg-primary', '주 동작 · 링크')}
          ${견본('primary-hover', 'bg-primary-hover', 'hover')}
          ${견본('primary-pressed', 'bg-primary-pressed', 'active')}
          ${견본('primary-soft', 'bg-primary-soft', '칩 배경')}
        </div>`,
      )}
      ${절(
        '시그널 — 색만으로 의미를 전달하지 않는다',
        `<div class="grid max-w-3xl gap-4 sm:grid-cols-4">
          ${견본('success', 'bg-success', '완료 · 상승')}
          ${견본('warning', 'bg-warning', '주의')}
          ${견본('info', 'bg-info', '안내')}
          ${견본('danger', 'bg-danger', '오류 · 파괴적 동작')}
        </div>`,
      )}
      ${절(
        '읽히는 조합 — 대비 테스트가 지키는 것',
        `<div class="flex max-w-2xl flex-col gap-3">
          <div class="rounded-lg border border-border bg-surface p-5">
            <p class="t-body-md">표면 위 본문입니다. 여기가 AA 4.5:1 기준선입니다.</p>
            <p class="t-body-sm mt-1 text-fg-muted">보조 설명이 이 대비로 읽힙니다.</p>
            <p class="t-body-sm mt-1 text-fg-faint">
              fg-faint는 AA(4.5:1)에 못 미칩니다 — 플레이스홀더 전용이며 본문·캡션에 쓰지 않습니다.
            </p>
            <p class="t-body-sm mt-2"><span class="text-primary underline">링크 텍스트</span></p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="inline-flex h-6 items-center rounded-full bg-success-soft px-2.5 text-xs font-medium text-success">↑ 완료</span>
            <span class="inline-flex h-6 items-center rounded-full bg-warning-soft px-2.5 text-xs font-medium text-warning">주의</span>
            <span class="inline-flex h-6 items-center rounded-full bg-info-soft px-2.5 text-xs font-medium text-info">안내</span>
            <span class="inline-flex h-6 items-center rounded-full bg-danger-soft px-2.5 text-xs font-medium text-danger">↓ 실패</span>
          </div>
        </div>`,
      )}
    `),
};

export const 타이포: StoryObj = {
  render: () =>
    나란히(`
      ${절(
        '스케일 — 크기 · 굵기 · 자간 · 행간이 한 세트로 적용된다',
        `<div class="flex max-w-2xl flex-col gap-5">
          <div><div class="t-label-sm text-fg-faint">display</div><p class="t-display">Display</p></div>
          <div><div class="t-label-sm text-fg-faint">headline-lg</div><p class="t-headline-lg">큰 제목 Headline</p></div>
          <div><div class="t-label-sm text-fg-faint">headline-md</div><p class="t-headline-md">중간 제목 Headline</p></div>
          <div><div class="t-label-sm text-fg-faint">title-md</div><p class="t-title-md">카드 제목 Title</p></div>
          <div><div class="t-label-sm text-fg-faint">body-md</div><p class="t-body-md">본문입니다. 읽는 글의 기본 크기 Body</p></div>
          <div><div class="t-label-sm text-fg-faint">body-sm</div><p class="t-body-sm text-fg-muted">보조 설명 · 힌트 · 캡션</p></div>
          <div><div class="t-label-sm text-fg-faint">label-sm</div><p class="t-label-sm">폼 라벨 · FORM LABEL</p></div>
        </div>`,
      )}
      ${절(
        '수치는 모노스페이스 — 자릿수를 맞춘다',
        `<div class="flex max-w-2xl flex-col gap-4">
          <p class="t-metric">1,284</p>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-border bg-muted">
                  <th scope="col" class="t-label-sm px-4 py-3 text-start">항목</th>
                  <th scope="col" class="t-label-sm px-4 py-3 text-start">값</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border last:border-0">
                  <td class="px-4 py-3 text-[0.8125rem] text-fg">정렬된 수치</td>
                  <td class="px-4 py-3 text-end font-mono text-[0.8125rem] tabular-nums text-fg">1,284</td>
                </tr>
                <tr class="border-b border-border last:border-0">
                  <td class="px-4 py-3 text-[0.8125rem] text-fg">자릿수가 달라도</td>
                  <td class="px-4 py-3 text-end font-mono text-[0.8125rem] tabular-nums text-fg">97</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>`,
      )}
    `),
};

export const 형태와깊이: StoryObj = {
  render: () =>
    나란히(`
      ${절(
        '반경 — md 이상에는 초타원 곡선이 걸린다',
        `<div class="flex flex-wrap items-end gap-4">
          ${[
            ['sm', 'rounded-sm'],
            ['md', 'rounded-md'],
            ['lg', 'rounded-lg'],
            ['xl', 'rounded-xl'],
            ['full', 'rounded-full'],
          ]
            .map(
              ([n, c]) => `
            <div class="flex flex-col items-center gap-2">
              <div class="size-16 border border-border-strong bg-surface ${c}"></div>
              <span class="font-mono text-[0.8125rem] text-fg-muted">${n}</span>
            </div>`,
            )
            .join('')}
        </div>`,
      )}
      ${절(
        '깊이 — 같은 평면은 선으로, 떠 있는 것만 그림자로',
        `<div class="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div class="rounded-lg border border-border bg-elevated p-5">
            <p class="t-title-md">같은 평면</p>
            <p class="t-body-sm mt-1 text-fg-muted">헤어라인 보더가 면을 가릅니다. 그림자를 쓰지 않습니다.</p>
          </div>
          <div class="rounded-lg border border-border-strong bg-elevated p-5 shadow-md">
            <p class="t-title-md">실제로 떠 있음</p>
            <p class="t-body-sm mt-1 text-fg-muted">모달 · 팝오버 · 드롭다운에만 그림자를 씁니다.</p>
          </div>
        </div>`,
      )}
    `),
};
