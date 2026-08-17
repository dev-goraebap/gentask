import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * 디자인 토큰의 대비를 검증합니다.
 *
 * 기준은 docs/architecture/references/13-accessibility.md 6절이 소유하고
 * 값은 docs/design/DESIGN.md 가 채웁니다. 이 테스트가 둘 사이의 경계를 지킵니다.
 * 문서에만 적힌 기준은 팔레트가 바뀌는 순간 조용히 어긋나므로, 값을 갈아끼우거나
 * 오버라이드를 지우면 여기서 실패해야 합니다.
 *
 * 검증 대상은 실제 CSS 파일이며 이 파일에 값을 하드코딩하지 않습니다.
 * 하드코딩하면 두 벌이 되어 한쪽만 고치는 실수가 다시 가능해집니다.
 */

const STYLES = join(process.cwd(), 'src', 'app', 'styles.css');

type Mode = 'light' | 'dark';

// ── 색 변환 ────────────────────────────────────────────────────────────────
// OKLCH → OKLab → 선형 sRGB → 감마 sRGB 순서입니다. 감마 단계에서 색역을 벗어난
// 값이 잘리므로, 휘도는 자른 뒤의 값을 다시 선형화해 계산합니다. 브라우저가
// 실제로 표시하는 색과 같은 값을 검증해야 하기 때문입니다.

interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

function oklchToRgb(l: number, c: number, hDeg: number, alpha: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const bb = c * Math.sin(h);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * bb;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bb;
  const s_ = l - 0.0894841775 * a - 1.291485548 * bb;

  const lc = l_ ** 3;
  const mc = m_ ** 3;
  const sc = s_ ** 3;

  return {
    r: gamma(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc),
    g: gamma(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc),
    b: gamma(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc),
    a: alpha,
  };
}

function gamma(linear: number): number {
  const v = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.abs(linear) ** (1 / 2.4) - 0.055;
  return Math.min(1, Math.max(0, v));
}

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** 반투명 색을 불투명 배경 위에 합성합니다. */
function composite(front: Rgb, back: Rgb): Rgb {
  return {
    r: front.r * front.a + back.r * (1 - front.a),
    g: front.g * front.a + back.g * (1 - front.a),
    b: front.b * front.a + back.b * (1 - front.a),
    a: 1,
  };
}

function contrast(front: Rgb, back: Rgb): number {
  const f = front.a < 1 ? composite(front, back) : front;
  const [hi, lo] = [luminance(f), luminance(back)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ── CSS 파싱 ───────────────────────────────────────────────────────────────

/** `--name: value;` 를 추출합니다. 값이 여러 줄에 걸치거나 함수를 중첩해도 됩니다. */
function readTokens(css: string): Map<string, string> {
  const rootStart = css.indexOf(':root {');
  expect(rootStart, ':root 블록을 찾지 못했습니다').toBeGreaterThan(-1);

  const body = sliceBlock(css, css.indexOf('{', rootStart));
  const tokens = new Map<string, string>();

  const declaration = /--([\w-]+)\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = declaration.exec(body)) !== null) {
    const value = readValue(body, declaration.lastIndex);
    if (value !== null) tokens.set(match[1], value.trim());
  }
  return tokens;
}

function sliceBlock(source: string, openBrace: number): string {
  let depth = 0;
  for (let i = openBrace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(openBrace + 1, i);
    }
  }
  throw new Error('닫히지 않은 블록입니다.');
}

function readValue(body: string, from: number): string | null {
  let depth = 0;
  for (let i = from; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ';' && depth === 0) return body.slice(from, i);
  }
  return null;
}

/** 최상위 콤마로 인자를 나눕니다. */
function splitArgs(inner: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      parts.push(inner.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(inner.slice(start));
  return parts.map((p) => p.trim());
}

function parseColor(value: string): Rgb {
  const oklch = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%?))?\s*\)$/.exec(
    value,
  );
  if (!oklch) throw new Error(`oklch() 형태가 아닙니다: ${value}`);

  const alphaRaw = oklch[4];
  const alpha = alphaRaw === undefined ? 1 : Number(alphaRaw) / (oklch[5] === '%' ? 100 : 1);

  return oklchToRgb(Number(oklch[1]), Number(oklch[2]), Number(oklch[3]), alpha);
}

/** 토큰 하나를 해당 모드의 색으로 해석합니다. */
function resolve(tokens: Map<string, string>, name: string, mode: Mode): Rgb {
  const raw = tokens.get(name);
  expect(raw, `--${name} 토큰이 정의되어 있지 않습니다`).toBeDefined();

  const lightDark = /^light-dark\((.*)\)$/s.exec(raw!);
  if (!lightDark) {
    throw new Error(
      `--${name} 이 light-dark() 로 선언되어 있지 않습니다. ` +
        '두 모드의 값을 한 자리에 함께 두어야 한쪽만 고치는 실수가 불가능해집니다.',
    );
  }

  const args = splitArgs(lightDark[1]);
  expect(args, `--${name} 의 light-dark() 인자가 둘이 아닙니다`).toHaveLength(2);

  return parseColor(args[mode === 'light' ? 0 : 1]);
}

// ── 검증 대상 ──────────────────────────────────────────────────────────────

/** 본문과 보조 텍스트는 AA 4.5:1 을 넘어야 합니다. */
const TEXT_PAIRS: Array<[front: string, back: string]> = [
  ['foreground', 'background'],
  ['foreground-secondary', 'background'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'muted'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['mark-foreground', 'mark'],
  ['destructive', 'background'],
  ['destructive', 'card'],
  ['warning', 'background'],
  ['info', 'background'],
  ['success', 'background'],
  ['primary', 'background'],
];

/*
 * 컨트롤 경계와 포커스 링은 UI 3:1 을 넘어야 합니다.
 *
 * --border 는 대상이 아닙니다. 같은 평면에서 면을 가르는 장식선이며 사라져도
 * 컴포넌트를 식별하지 못하게 되지 않으므로 WCAG 1.4.11 의 대상이 아닙니다.
 * 여기에 3:1 을 걸면 모든 면 사이에 중간 회색 선이 그어져 헤어라인으로 구조를
 * 그린다는 시각 언어가 깨집니다. 느슨해진 것이 아니라 더 정교하게 나눈 것입니다.
 *
 * 반대로 --input 은 "여기가 입력란"임을 알리는 유일한 단서이므로 강제합니다.
 */
const UI_PAIRS: Array<[front: string, back: string]> = [
  ['input', 'background'],
  ['input', 'card'],
  ['ring', 'background'],
  ['ring', 'card'],
];

/**
 * 짝을 반드시 함께 정의해야 하는 토큰입니다. 04-design-system.md 3.2절.
 * `background` 의 짝은 `foreground` 이며 Spartan 규약이 그 이름을 접두사 없이 씁니다.
 */
const REQUIRED_PAIRS: Array<[surface: string, ink: string]> = [
  ['background', 'foreground'],
  ['card', 'card-foreground'],
  ['popover', 'popover-foreground'],
  ['primary', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['sidebar', 'sidebar-foreground'],
];

const MODES: Mode[] = ['light', 'dark'];

describe('디자인 토큰', () => {
  const css = readFileSync(STYLES, 'utf8');
  const tokens = readTokens(css);

  it.each(REQUIRED_PAIRS)('--%s 는 짝이 되는 --%s 를 함께 갖습니다', (surface, ink) => {
    expect(tokens.has(surface), `--${surface} 이 없습니다`).toBe(true);
    expect(
      tokens.has(ink),
      `--${surface} 에 짝이 되는 --${ink} 가 없습니다. ` +
        '짝이 없으면 그 위에 어떤 색 텍스트를 올릴지 판단이 갈려 대비 문제를 만듭니다.',
    ).toBe(true);
  });

  it('Spartan 프리셋이 노출하지 않는 토큰은 @theme inline 에 등록되어 있습니다', () => {
    const extra = ['foreground-secondary', 'warning', 'info', 'success', 'toolbar', 'mark'];
    for (const name of extra) {
      expect(
        css.includes(`--color-${name}: var(--${name})`),
        `--${name} 이 @theme inline 에 등록되어 있지 않습니다. ` +
          '등록하지 않으면 유틸리티 클래스가 생성되지 않아 변수만 정의된 채 쓸 수 없습니다.',
      ).toBe(true);
    }
  });

  for (const mode of MODES) {
    describe(mode, () => {
      it.each(TEXT_PAIRS)('%s 는 %s 위에서 4.5:1 이상입니다', (front, back) => {
        const ratio = contrast(resolve(tokens, front, mode), resolve(tokens, back, mode));
        expect(ratio, `실측 ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });

      it.each(UI_PAIRS)('%s 는 %s 위에서 3:1 이상입니다', (front, back) => {
        const ratio = contrast(resolve(tokens, front, mode), resolve(tokens, back, mode));
        expect(ratio, `실측 ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
      });
    });
  }
});
