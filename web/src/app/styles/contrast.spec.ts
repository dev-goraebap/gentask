import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/**
 * Krill 팔레트가 WCAG 대비 기준을 넘는지 검증한다 (결정-0024).
 *
 * 값을 하드코딩하지 않고 **실제 `krill.css`를 파싱**한다. 그래서 Krill을 새
 * 판으로 갈아끼웠을 때 대비가 무너지면 이 테스트가 그 자리에서 실패한다.
 * 검증을 문서에만 적어두면 다음 사람이 다시 돌리지 않는다.
 *
 * ## 무엇을 강제하고 무엇을 강제하지 않는가
 *
 * **텍스트는 AA 4.5:1.** 본문·보조 텍스트·시그널 텍스트·버튼 라벨이 해당한다.
 *
 * **폼 컨트롤 테두리(`border-control`)는 3:1.** 입력란의 테두리는 "여기가
 * 입력란"임을 알리는 <b>유일한 시각 정보</b>라 WCAG 1.4.11 대상이다.
 *
 * **장식선(`border`·`border-strong`)에는 3:1을 요구하지 않는다.** 이것이
 * 이전 팔레트와 달라진 점이며, 느슨해진 것이 아니라 Krill이 더 정교하게
 * 나눈 것이다 — 이 선들은 면을 가르는 장식이고 사라져도 컴포넌트를 식별하지
 * 못하게 되지는 않는다. 은은한 톤이 이 시스템의 정체성이라, 장식선을 진하게
 * 만들어 미감을 깨는 대신 **필요한 곳에만 진한 선**(`border-control`)을 둔다.
 * 그 대신 `border-control`의 3:1은 위에서 강제한다.
 *
 * ## 알파가 섞인 값
 *
 * 다크 모드의 보더는 `oklch(1 0 0 / 0.1)`처럼 반투명이다. 실제로 보이는 색은
 * 뒤에 깔린 면과 합성된 결과이므로, 배경 위에 합성한 뒤 대비를 계산한다.
 */

const 읽기 = (파일: string) => readFileSync(new URL(파일, import.meta.url), 'utf8');

// ── OKLCH → sRGB ────────────────────────────────────────────────────

interface 색 {
  /** 감마 인코딩된 sRGB 0~1 */
  rgb: [number, number, number];
  alpha: number;
}

const 클램프 = (v: number) => Math.min(1, Math.max(0, v));

/** 선형 sRGB → 감마 인코딩 sRGB */
const 감마 = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** 감마 인코딩 sRGB → 선형 sRGB */
const 선형 = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/**
 * `oklch(L C H)` 또는 `oklch(L C H / A)`를 sRGB로 옮긴다.
 * OKLCH → OKLab → LMS → 선형 sRGB → 감마 인코딩 순서다.
 */
const oklch파싱 = (값: string): 색 | null => {
  const m = 값.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)/);
  if (!m) return null;

  const [L, C, H] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const alpha = m[4] === undefined ? 1 : Number(m[4]);

  const 라디안 = (H * Math.PI) / 180;
  const a = C * Math.cos(라디안);
  const b = C * Math.sin(라디안);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const [l, mm, s] = [l_ ** 3, m_ ** 3, s_ ** 3];

  const 선형rgb: [number, number, number] = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];

  // 색역을 벗어난 값은 브라우저가 잘라내므로 여기서도 자른다
  return { rgb: 선형rgb.map((c) => 클램프(감마(클램프(c)))) as [number, number, number], alpha };
};

/** 반투명 색을 뒤에 깔린 면 위에 합성한다. 브라우저와 같이 감마 공간에서 섞는다. */
const 합성 = (앞: 색, 뒤: 색): 색 => ({
  rgb: 앞.rgb.map((c, i) => c * 앞.alpha + 뒤.rgb[i] * (1 - 앞.alpha)) as [number, number, number],
  alpha: 1,
});

const 상대휘도 = (c: 색) => {
  const [r, g, b] = c.rgb.map(선형);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const 대비 = (앞: 색, 뒤: 색) => {
  const 합성된앞 = 앞.alpha < 1 ? 합성(앞, 뒤) : 앞;
  const [밝음, 어두움] = [상대휘도(합성된앞), 상대휘도(뒤)].sort((x, y) => y - x);
  return (밝음 + 0.05) / (어두움 + 0.05);
};

// ── krill.css 파싱 ──────────────────────────────────────────────────

/** `{`부터 짝이 맞는 `}`까지를 잘라낸다. */
const 블록 = (css: string, 시작표식: string) => {
  const 시작 = css.indexOf(시작표식);
  if (시작 < 0) throw new Error(`${시작표식}를 찾지 못했다`);
  let 깊이 = 0;
  for (let i = 시작; i < css.length; i++) {
    if (css[i] === '{') 깊이++;
    else if (css[i] === '}' && --깊이 === 0) return css.slice(시작, i);
  }
  throw new Error(`${시작표식}의 닫는 괄호를 찾지 못했다`);
};

const 색맵 = (블록내용: string) => {
  const map = new Map<string, 색>();
  for (const [, 이름, 값] of 블록내용.matchAll(/--color-([a-z-]+)\s*:\s*(oklch\([^)]*\))\s*;/g)) {
    const 파싱됨 = oklch파싱(값);
    if (파싱됨) map.set(이름, 파싱됨);
  }
  return map;
};

const css = 읽기('./krill.css');
/** 라이트는 @theme 블록에 있고, 다크는 .dark가 그 위를 덮는다. */
const 라이트 = 색맵(블록(css, '@theme {'));
const 다크 = new Map(라이트);
for (const [이름, 값] of 색맵(블록(css, '.dark {'))) {
  다크.set(이름, 값);
}

/**
 * 우리 진입점의 오버라이드까지 얹는다 — <b>앱이 실제로 싣는 값</b>을 검증해야
 * 하기 때문이다. krill.css만 읽으면 우리가 고친 토큰이 반영되지 않아,
 * 통과하는 테스트가 실제 화면과 다른 것을 보게 된다.
 */
for (const [이름, 값] of 색맵(블록(읽기('../../styles.css'), '.dark {'))) {
  다크.set(이름, 값);
}

const 팔레트 = { 라이트, 다크 } as const;

// ── 검증할 조합 ─────────────────────────────────────────────────────

const AA = 4.5;
const UI = 3;

/** [전경 역할, 배경 역할, 요구치, 설명] */
const 텍스트조합: [string, string, number, string][] = [
  ['fg', 'background', AA, '본문이 캔버스에서'],
  ['fg', 'surface', AA, '본문이 카드에서'],
  ['fg', 'elevated', AA, '본문이 모달에서'],
  ['fg', 'chrome', AA, '본문이 앱 크롬에서'],
  ['fg-muted', 'background', AA, '보조 텍스트가 캔버스에서'],
  ['fg-muted', 'surface', AA, '보조 텍스트가 카드에서'],
  ['fg-muted', 'muted', AA, '보조 텍스트가 채움 위에서'],

  // 링크·아이콘은 primary를 그대로 텍스트로 쓴다(별도 잉크 토큰이 없다).
  // 이 단언이 그 전제를 지킨다 — 무너지면 링크가 읽히지 않는다.
  ['primary', 'background', AA, '링크가 캔버스에서'],
  ['primary', 'surface', AA, '링크가 카드에서'],
  ['primary', 'primary-soft', AA, '칩 텍스트가 자기 soft 배경에서'],

  ['primary-fg', 'primary', AA, '주 버튼 라벨'],
  ['primary-fg', 'primary-hover', AA, '주 버튼 라벨(hover)'],
  ['fg-inverse', 'danger', AA, '파괴적 버튼 라벨'],

  // Krill의 시그널 명도는 "표면 위 텍스트"와 "soft 배경 위 칩"을 동시에
  // 4.5:1로 만드는 최대값으로 잡혀 있다. 두 조건을 다 확인한다.
  ['success', 'surface', AA, 'success 텍스트가 카드에서'],
  ['warning', 'surface', AA, 'warning 텍스트가 카드에서'],
  ['info', 'surface', AA, 'info 텍스트가 카드에서'],
  ['danger', 'surface', AA, 'danger 텍스트가 카드에서'],
  ['success', 'success-soft', AA, 'success 칩'],
  ['warning', 'warning-soft', AA, 'warning 칩'],
  ['info', 'info-soft', AA, 'info 칩'],
  ['danger', 'danger-soft', AA, 'danger 칩'],
];

/**
 * 비텍스트(WCAG 1.4.11). 장식선은 여기 없다 — 파일 머리말의 근거 참조.
 *
 * `fg-faint`가 여기 있는 이유: 라이트에서 3.44:1로 <b>AA에 못 미친다</b>(다크는 4.10).
 * Krill이 이 토큰을 "플레이스홀더·캡션"으로 뒀지만, 캡션은 텍스트라 4.5:1이 필요하다.
 * <b>이 프로젝트에서는 `fg-faint`를 플레이스홀더 전용으로 쓰고 본문·캡션에는 쓰지 않는다</b>
 * (그런 자리에는 `fg-muted`를 쓴다). 3:1을 여기서 고정해 두면 더 낮아질 때 걸린다.
 */
const 비텍스트조합: [string, string, number, string][] = [
  ['fg-faint', 'surface', UI, '플레이스홀더가 카드에서 (본문 금지 토큰)'],
  ['fg-faint', 'background', UI, '플레이스홀더가 캔버스에서 (본문 금지 토큰)'],
  ['border-control', 'background', UI, '폼 컨트롤 테두리가 캔버스에서'],
  ['border-control', 'surface', UI, '폼 컨트롤 테두리가 카드 위에서'],
  ['primary', 'background', UI, '주 버튼 채움이 캔버스에서 구분되는지'],
  ['danger', 'background', UI, '파괴적 채움이 캔버스에서 구분되는지'],
];

describe('Krill 팔레트 대비 — krill.css를 파싱해 계산한다', () => {
  it('라이트·다크 색 토큰을 읽어냈다', () => {
    expect(라이트.size).toBeGreaterThan(20);
    expect(다크.size).toBeGreaterThanOrEqual(라이트.size);
    // 다크가 실제로 덮어썼는지 — 같으면 .dark 블록 파싱이 실패한 것이다
    expect(다크.get('fg')!.rgb).not.toEqual(라이트.get('fg')!.rgb);
  });

  it('OKLCH 변환이 알려진 값과 맞는다', () => {
    // oklch(1 0 0) = 흰색, oklch(0 0 0) = 검정
    expect(대비(oklch파싱('oklch(1 0 0)')!, oklch파싱('oklch(0 0 0)')!)).toBeCloseTo(21, 0);
  });

  for (const 모드 of ['라이트', '다크'] as const) {
    describe(`${모드} — 텍스트 (AA)`, () => {
      for (const [전경, 배경, 요구, 설명] of 텍스트조합) {
        it(`${설명} — ${전경} / ${배경} ≥ ${요구}:1`, () => {
          const fg = 팔레트[모드].get(전경);
          const bg = 팔레트[모드].get(배경);
          expect(fg, `${전경}을 찾지 못했다`).toBeDefined();
          expect(bg, `${배경}을 찾지 못했다`).toBeDefined();
          expect(대비(fg!, bg!)).toBeGreaterThanOrEqual(요구);
        });
      }
    });

    describe(`${모드} — 비텍스트 (1.4.11)`, () => {
      for (const [전경, 배경, 요구, 설명] of 비텍스트조합) {
        it(`${설명} — ${전경} / ${배경} ≥ ${요구}:1`, () => {
          const fg = 팔레트[모드].get(전경);
          const bg = 팔레트[모드].get(배경);
          expect(fg, `${전경}을 찾지 못했다`).toBeDefined();
          expect(bg, `${배경}을 찾지 못했다`).toBeDefined();
          expect(대비(fg!, bg!)).toBeGreaterThanOrEqual(요구);
        });
      }
    });
  }
});
