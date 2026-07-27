import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/**
 * 팔레트가 WCAG 대비 기준을 넘는지 검증한다.
 *
 * 값을 하드코딩하지 않고 **실제 CSS 파일을 파싱**한다. 그래서 누가
 * halo.css의 색을 바꾸거나 tokens.css의 매핑을 바꾸면 이 테스트가 그
 * 자리에서 실패한다. 대비 검증을 문서에만 적어두면 다음 사람이 다시
 * 돌리지 않는다.
 *
 * 기준
 * - 본문·보조 텍스트: AA 4.5:1
 * - 비활성·메타데이터·경계선·채움: UI 기준 3:1
 *   (WCAG 1.4.11 Non-text Contrast. subtle은 본문 금지 토큰이라 여기 해당한다)
 */

const 읽기 = (파일: string) => readFileSync(new URL(파일, import.meta.url), 'utf8');

const 팔레트 = (() => {
  const css = 읽기('./themes/halo.css');
  const map = new Map<string, string>();
  for (const [, 이름, 값] of css.matchAll(/--prim-([a-z]+-\d+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    map.set(이름, 값);
  }
  return map;
})();

/** tokens.css에서 시맨틱 이름 → [라이트 프리미티브, 다크 프리미티브]를 뽑는다. */
const 매핑 = (() => {
  const css = 읽기('./tokens.css');
  const 라이트 = new Map<string, string>();
  const 다크 = new Map<string, string>();

  // light-dark(var(--prim-a), var(--prim-b))
  const 양쪽 =
    /--color-([a-z-]+)\s*:\s*light-dark\(\s*var\(--prim-([a-z]+-\d+)\)\s*,\s*var\(--prim-([a-z]+-\d+)\)\s*\)/g;
  for (const [, 역할, l, d] of css.matchAll(양쪽)) {
    라이트.set(역할, l);
    다크.set(역할, d);
  }

  // 두 모드가 같은 값을 쓰는 경우: --color-x: var(--prim-y);
  const 공용 = /--color-([a-z-]+)\s*:\s*var\(--prim-([a-z]+-\d+)\)\s*;/g;
  for (const [, 역할, p] of css.matchAll(공용)) {
    라이트.set(역할, p);
    다크.set(역할, p);
  }

  return { 라이트, 다크 };
})();

const 상대휘도 = (hex: string) => {
  const s = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(s.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const 대비 = (a: string, b: string) => {
  const [밝음, 어두움] = [상대휘도(a), 상대휘도(b)].sort((x, y) => y - x);
  return (밝음 + 0.05) / (어두움 + 0.05);
};

const AA = 4.5;
const UI = 3;

/** [전경 역할, 배경 역할, 요구치, 설명] */
const 조합: [string, string, number, string][] = [
  ['foreground', 'background', AA, '본문이 캔버스에서'],
  ['foreground', 'surface', AA, '본문이 카드에서'],
  ['foreground', 'elevated', AA, '본문이 모달에서'],
  ['muted', 'background', AA, '보조 텍스트가 캔버스에서'],
  ['muted', 'surface', AA, '보조 텍스트가 카드에서'],
  ['subtle', 'background', UI, '비활성·메타가 캔버스에서'],
  ['subtle', 'surface', UI, '비활성·메타가 카드에서'],
  ['accent-ink', 'background', AA, '액센트 잉크가 캔버스에서'],
  ['accent-ink', 'surface', AA, '액센트 잉크가 카드에서'],
  ['on-accent', 'accent', AA, '액센트 채움 위의 텍스트'],
  ['accent', 'background', UI, '액센트 채움이 캔버스에서 구분되는지'],
  ['on-danger', 'danger-fill', AA, '파괴적 채움 위의 텍스트'],
  ['on-danger', 'danger-fill-hover', AA, '파괴적 채움 호버 위의 텍스트'],
  ['danger-fill', 'background', UI, '파괴적 채움이 캔버스에서 구분되는지'],
  ['success', 'surface', AA, 'success 텍스트'],
  ['warning', 'surface', AA, 'warning 텍스트'],
  ['info', 'surface', AA, 'info 텍스트'],
  ['danger', 'surface', AA, 'danger 텍스트'],
  ['danger', 'background', AA, 'danger 텍스트가 캔버스에서'],
];

describe('팔레트 대비 — 파싱한 실제 토큰 값으로 계산한다', () => {
  it('프리미티브와 시맨틱 매핑을 CSS에서 읽어냈다', () => {
    expect(팔레트.size).toBeGreaterThan(15);
    expect(매핑.라이트.size).toBeGreaterThan(10);
    expect(매핑.다크.size).toBeGreaterThan(10);
  });

  for (const 모드 of ['라이트', '다크'] as const) {
    describe(모드, () => {
      for (const [전경, 배경, 요구, 설명] of 조합) {
        it(`${설명} — ${전경} / ${배경} ≥ ${요구}:1`, () => {
          const fg = 팔레트.get(매핑[모드].get(전경)!);
          const bg = 팔레트.get(매핑[모드].get(배경)!);

          expect(fg, `${전경} 매핑을 찾지 못했다`).toBeDefined();
          expect(bg, `${배경} 매핑을 찾지 못했다`).toBeDefined();

          expect(대비(fg!, bg!)).toBeGreaterThanOrEqual(요구);
        });
      }
    });
  }
});
