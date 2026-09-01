import { BreakpointObserver } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
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

  it('넓은 화면에서는 트리거 옆에 붙고 뒤를 덮지 않습니다', async () => {
    const host = stand({ wide: true });
    const pane = await open(host);

    expect(pane.textContent).toContain('골라야 하는 것');
    expect(wrapperOfGlobalStrategy()).toBeNull();
    expect(backdrop()?.className).toContain('pointer-events-none');
    expect(backdrop()?.className).not.toContain('bg-veil');
  });

  it('좁은 화면에서는 아래에 붙고 뒤를 덮습니다', async () => {
    const host = stand({ wide: false });
    const pane = await open(host);

    expect(pane.textContent).toContain('골라야 하는 것');
    expect(wrapperOfGlobalStrategy()).not.toBeNull();
    expect(backdrop()?.className).toContain('bg-veil');
  });

  it('좁은 화면의 판은 화면을 채우고 위쪽만 둥급니다', async () => {
    const host = stand({ wide: false });
    const pane = await open(host);
    const surface = pane.querySelector('[data-slot="popover-content"]');

    expect(surface?.className).toContain('w-screen');
    expect(surface?.className).toContain('rounded-t-xl');
    expect(surface?.className).not.toContain('rounded-md');
  });

  /*
   * 새로고침 없이 화면 폭을 바꾸는 경우다. 뒤를 덮는 판의 **존재**를 폭에 맡기면 그 값이 한 번만
   * 읽혀 여기서 어긋난다 — 넓은 화면인데 뒤가 덮이거나, 좁은 화면인데 덮이지 않는다.
   */
  it('화면 폭이 바뀌면 새로 세우지 않아도 따라옵니다', async () => {
    const host = stand({ wide: true });
    await open(host);
    await close(host);

    host.widen(false);
    const compactPane = await open(host);

    expect(wrapperOfGlobalStrategy()).not.toBeNull();
    expect(backdrop()?.className).toContain('bg-veil');
    expect(compactPane.textContent).toContain('골라야 하는 것');

    await close(host);

    host.widen(true);
    await open(host);

    expect(wrapperOfGlobalStrategy()).toBeNull();
    expect(backdrop()?.className).toContain('pointer-events-none');
    expect(backdrop()?.className).not.toContain('bg-veil');
  });
});

interface Host {
  readonly fixture: ComponentFixture<PopoverHostStub>;
  widen(wide: boolean): void;
}

function stand(options: { wide: boolean }): Host {
  const state = new BehaviorSubject(breakpointState(options.wide));

  TestBed.configureTestingModule({
    providers: [{ provide: BreakpointObserver, useValue: { observe: () => state } }],
  });

  const fixture = TestBed.createComponent(PopoverHostStub);
  fixture.detectChanges();

  return {
    fixture,
    widen: (wide: boolean) => {
      state.next(breakpointState(wide));
      fixture.detectChanges();
    },
  };
}

function breakpointState(matches: boolean) {
  return { matches, breakpoints: { '(min-width: 48rem)': matches } };
}

/**
 * 판 안에서 찾습니다. `document.body` 로 찾으면 내용이 화면 안에 남아 판이 비어도 통과합니다 —
 * FE-STY-185 가 그 자리를 갖습니다.
 */
async function open(host: Host): Promise<HTMLElement> {
  const trigger = host.fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  trigger.click();

  host.fixture.detectChanges();
  await host.fixture.whenStable();

  const pane = document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
  expect(pane).not.toBeNull();

  return pane as HTMLElement;
}

async function close(host: Host): Promise<void> {
  const trigger = host.fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  trigger.click();

  host.fixture.detectChanges();
  await host.fixture.whenStable();
}

/** 전역 위치 전략만 이 클래스를 답니다. 트리거에 붙는 전략은 달지 않습니다. */
function wrapperOfGlobalStrategy(): Element | null {
  return document.querySelector('.cdk-overlay-container .cdk-global-overlay-wrapper');
}

function backdrop(): Element | null {
  return document.querySelector('.cdk-overlay-container .cdk-overlay-backdrop');
}
