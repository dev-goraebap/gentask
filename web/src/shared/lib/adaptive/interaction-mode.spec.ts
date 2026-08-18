import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { injectInteractionMode } from './interaction-mode';

/*
 * 분기가 있는 판정이라 단위로 고정합니다. 17-testing.md 2.1절.
 *
 * Windows 터치스크린은 마우스가 있어도 주 포인터를 coarse 로 보고하는 경우가 있어
 * any-pointer / any-hover 로 판정합니다. 07-adaptive-ui.md 2절.
 */
describe('injectInteractionMode', () => {
  it('정밀한 포인터가 있으면 pointer 이다', () => {
    expect(modeOf({ '(any-pointer: fine)': true, '(any-hover: hover)': false })).toBe('pointer');
  });

  it('호버할 수 있으면 pointer 이다', () => {
    expect(modeOf({ '(any-pointer: fine)': false, '(any-hover: hover)': true })).toBe('pointer');
  });

  it('정밀한 포인터도 호버도 없으면 touch 이다', () => {
    expect(modeOf({ '(any-pointer: fine)': false, '(any-hover: hover)': false })).toBe('touch');
  });

  it('주 포인터가 coarse 여도 마우스가 있으면 pointer 이다', () => {
    expect(
      modeOf({
        '(pointer: coarse)': true,
        '(hover: none)': true,
        '(any-pointer: fine)': true,
        '(any-hover: hover)': true,
      }),
    ).toBe('pointer');
  });
});

function modeOf(breakpoints: Record<string, boolean>): 'pointer' | 'touch' {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: BreakpointObserver,
        useValue: {
          observe: () => of({ matches: Object.values(breakpoints).some(Boolean), breakpoints }),
        },
      },
    ],
  });

  return TestBed.runInInjectionContext(() => injectInteractionMode())();
}
