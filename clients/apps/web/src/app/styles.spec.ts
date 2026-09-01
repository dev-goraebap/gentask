import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const STYLES = join(process.cwd(), 'src', 'app', 'styles.css');

type Mode = 'light' | 'dark';

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
  ['kind-epic-foreground', 'kind-epic'],
  ['kind-story-foreground', 'kind-story'],
  ['kind-task-foreground', 'kind-task'],
  ['kind-bug-foreground', 'kind-bug'],
  ['destructive', 'background'],
  ['destructive', 'card'],
  ['warning', 'background'],
  ['info', 'background'],
  ['success', 'background'],
  ['primary', 'background'],
];

const UI_PAIRS: Array<[front: string, back: string]> = [
  ['input', 'background'],
  ['input', 'card'],
  ['ring', 'background'],
  ['ring', 'card'],
];

const REQUIRED_PAIRS: Array<[surface: string, ink: string]> = [
  ['background', 'foreground'],
  ['card', 'card-foreground'],
  ['popover', 'popover-foreground'],
  ['primary', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['sidebar', 'sidebar-foreground'],
  ['kind-epic', 'kind-epic-foreground'],
  ['kind-story', 'kind-story-foreground'],
  ['kind-task', 'kind-task-foreground'],
  ['kind-bug', 'kind-bug-foreground'],
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
    const extra = [
      'foreground-secondary',
      'warning',
      'info',
      'success',
      'toolbar',
      'mark',
      'kind-epic',
      'kind-epic-foreground',
      'kind-story',
      'kind-story-foreground',
      'kind-task',
      'kind-task-foreground',
      'kind-bug',
      'kind-bug-foreground',
    ];
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
