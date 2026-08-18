import { BreakpointObserver } from '@angular/cdk/layout';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { injectViewportClass } from './viewport-class';

/*
 * 분기가 있는 판정이라 단위로 고정합니다. 17-testing.md 2.1절.
 *
 * 서버 분기를 함께 검증하는 이유는 그것이 침묵하는 결함이기 때문입니다. 비브라우저에서
 * 쿼리는 항상 false 이므로 분기가 없으면 넓은 화면의 첫 페인트가 시트가 됩니다.
 * 07-adaptive-ui.md 3.2절.
 */
describe('injectViewportClass', () => {
  it('임계값 이상이면 wide 이다', () => {
    expect(viewportOf(true)).toBe('wide');
  });

  it('임계값 미만이면 compact 이다', () => {
    expect(viewportOf(false)).toBe('compact');
  });

  it('비브라우저에서는 쿼리가 false 여도 wide 이다', () => {
    expect(viewportOf(false, 'server')).toBe('wide');
  });
});

function viewportOf(matches: boolean, platform: 'browser' | 'server' = 'browser') {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platform },
      {
        provide: BreakpointObserver,
        useValue: {
          observe: () => of({ matches, breakpoints: { '(min-width: 48rem)': matches } }),
        },
      },
    ],
  });

  return TestBed.runInInjectionContext(() => injectViewportClass())();
}
