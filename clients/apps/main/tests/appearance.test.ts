import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { palettes, paletteTokens } from '../src/shared/ui/theme/palettes';

const tokens = { neutral: {}, ...Object.fromEntries(palettes.map(palette => [palette.id, paletteTokens(palette)])) };
function boot(palette?: string, media?: string, blocked = false) {
  const dom = new JSDOM('<html><head><meta name="theme-color"><link id="app-favicon"></head><body></body></html>', { url: 'https://gentask.test', runScripts: 'outside-only' });
  Object.defineProperty(dom.window, 'matchMedia', { value: () => ({ matches: true, addEventListener() {} }) });
  if (palette) dom.window.localStorage.setItem('gentask-palette', palette);
  if (media) dom.window.localStorage.setItem('astryx-media', media);
  if (blocked) Object.defineProperty(dom.window, 'localStorage', { get() { throw new Error('blocked'); } });
  const bootstrap = readFileSync(new URL('../src/shared/ui/theme/appearance-bootstrap.js', import.meta.url), 'utf8');
  dom.window.eval(`(${bootstrap})(${JSON.stringify(tokens)})`);
  return dom;
}

test('저장한 배색과 밝기를 첫 실행에 복원하고 기본 배색으로 되돌린다', () => {
  const dom = boot('sage', 'light');
  try {
    const { window } = dom;
    assert.equal(window.document.body.dataset.gentaskPalette, 'sage');
    assert.equal(window.document.body.dataset.astryxMedia, 'light');
    assert.ok(window.document.body.style.getPropertyValue('--color-accent').includes('#4e6748'));
    window.dispatchEvent(new window.CustomEvent('gentask-appearance-change', { detail: { palette: 'neutral', media: 'dark' } }));
    assert.equal(window.localStorage.getItem('gentask-palette'), 'neutral');
    assert.equal(window.localStorage.getItem('astryx-media'), 'dark');
    assert.equal(window.document.body.style.getPropertyValue('--color-accent'), '');
    assert.equal(window.document.querySelector('meta')?.getAttribute('content'), '#1b1b1b');
    window.localStorage.setItem('gentask-palette', 'clay');
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'gentask-palette' }));
    assert.equal(window.document.body.dataset.gentaskPalette, 'clay');
  } finally { dom.window.close(); }
});

test('잘못된 저장값과 저장소 차단에도 기본 테마와 변경 기능을 유지한다', () => {
  for (const blocked of [false, true]) {
    const dom = boot('unknown', 'invalid', blocked);
    try {
      assert.equal(dom.window.document.body.dataset.gentaskPalette, 'neutral');
      assert.equal(dom.window.document.body.dataset.astryxMedia, 'dark');
      dom.window.dispatchEvent(new dom.window.CustomEvent('gentask-appearance-change', { detail: { palette: 'paper', media: 'light' } }));
      assert.equal(dom.window.document.body.dataset.gentaskPalette, 'paper');
      assert.equal(dom.window.document.body.dataset.astryxMedia, 'light');
    } finally { dom.window.close(); }
  }
});
