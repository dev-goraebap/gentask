import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    TestBed.resetTestingModule();
  });

  function create(): ThemeService {
    return TestBed.inject(ThemeService);
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
