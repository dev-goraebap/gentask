import { BreakpointObserver } from '@angular/cdk/layout';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { injectViewportClass } from './viewport-class';

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
