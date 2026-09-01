import { BreakpointObserver } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { HlmPopoverImports } from '../index';

@Component({
  selector: 'app-popover-host-stub',
  imports: [HlmPopoverImports],
  template: `
    <hlm-popover>
      <button hlmPopoverTrigger type="button">고르기</button>
      <hlm-popover-content *hlmPopoverPortal class="p-1 md:w-52">골라야 하는 것</hlm-popover-content>
    </hlm-popover>
  `,
})
class PopoverHostStub {}

describe('HlmPopover', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('넓은 화면에서는 트리거 옆에 붙습니다', async () => {
    const pane = await open({ wide: true });

    expect(pane.textContent).toContain('골라야 하는 것');
    expect(wrapperOfGlobalStrategy()).toBeNull();
    expect(backdrop()).toBeNull();
  });

  it('좁은 화면에서는 아래에 붙고 뒤를 덮습니다', async () => {
    const pane = await open({ wide: false });

    expect(pane.textContent).toContain('골라야 하는 것');
    expect(wrapperOfGlobalStrategy()).not.toBeNull();
    expect(backdrop()).not.toBeNull();
  });

  it('좁은 화면의 판은 화면을 채우고 위쪽만 둥급니다', async () => {
    const pane = await open({ wide: false });
    const surface = pane.querySelector('[data-slot="popover-content"]');

    expect(surface?.className).toContain('w-screen');
    expect(surface?.className).toContain('rounded-t-xl');
    expect(surface?.className).not.toContain('rounded-md');
  });
});

/**
 * 판 안에서 찾습니다. `document.body` 로 찾으면 내용이 화면 안에 남아 판이 비어도 통과합니다 —
 * FE-STY-185 가 그 자리를 갖습니다.
 */
async function open(options: { wide: boolean }): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: BreakpointObserver,
        useValue: {
          observe: () =>
            of({
              matches: options.wide,
              breakpoints: { '(min-width: 48rem)': options.wide },
            }),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(PopoverHostStub);
  fixture.detectChanges();
  await fixture.whenStable();

  const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  trigger.click();

  fixture.detectChanges();
  await fixture.whenStable();

  const pane = document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
  expect(pane).not.toBeNull();

  return pane as HTMLElement;
}

/** 전역 위치 전략만 이 클래스를 답니다. 트리거에 붙는 전략은 달지 않습니다. */
function wrapperOfGlobalStrategy(): Element | null {
  return document.querySelector('.cdk-overlay-container .cdk-global-overlay-wrapper');
}

function backdrop(): Element | null {
  return document.querySelector('.cdk-overlay-container .cdk-overlay-backdrop');
}
