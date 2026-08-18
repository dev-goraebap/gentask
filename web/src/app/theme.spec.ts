import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeStore } from './theme';

/*
 * 색상 모드 선택의 저장과 복원, 그리고 문서 루트에 붙는 클래스를 검증합니다.
 *
 * CSS 가 `:root.light` 와 `:root.dark` 를 받을 준비를 해 두었으므로, 그 클래스가
 * 실제로 붙는지가 라이트와 다크를 실제로 볼 수 있는지를 가릅니다.
 * 규칙은 docs/architecture/references/04-design-system.md 7절입니다.
 */
describe('ThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    TestBed.resetTestingModule();
  });

  function create(): ThemeStore {
    return TestBed.inject(ThemeStore);
  }

  it('기본값은 시스템 설정이며 문서 루트에 클래스를 붙이지 않는다', () => {
    const theme = create();
    TestBed.tick();

    expect(theme.preference()).toBe('system');
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('시스템 → 라이트 → 다크 → 시스템 순으로 돈다', () => {
    const theme = create();

    theme.cycle();
    expect(theme.preference()).toBe('light');

    theme.cycle();
    expect(theme.preference()).toBe('dark');

    theme.cycle();
    expect(theme.preference()).toBe('system');
  });

  it('사용자가 고르면 문서 루트에 해당 클래스만 붙는다', () => {
    const theme = create();

    theme.select('dark');
    TestBed.tick();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);

    theme.select('light');
    TestBed.tick();
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('시스템으로 되돌리면 클래스를 걷어 CSS 의 판정에 다시 맡긴다', () => {
    const theme = create();

    theme.select('dark');
    TestBed.tick();
    theme.select('system');
    TestBed.tick();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('명시적 선택만 저장하고 시스템은 저장소에서 지운다', () => {
    const theme = create();

    theme.select('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    theme.select('system');
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('저장된 선택을 다음 세션에서 복원한다', () => {
    localStorage.setItem('theme', 'light');

    const theme = create();
    TestBed.tick();

    expect(theme.preference()).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('저장소에 남은 알 수 없는 값은 시스템으로 떨어뜨린다', () => {
    localStorage.setItem('theme', 'sepia');

    const theme = create();
    TestBed.tick();

    expect(theme.preference()).toBe('system');
  });
});
