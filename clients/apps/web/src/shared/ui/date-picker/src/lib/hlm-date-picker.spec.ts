import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { HlmDatePicker } from './hlm-date-picker';
import { HlmDatePickerTrigger } from './hlm-date-picker-trigger';

describe('HlmDatePicker', () => {
  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('wide 에서는 트리거에 연결된 팝오버로 연다', async () => {
    const overlay = await open('wide');

    expect(overlay.querySelector('hlm-calendar')).not.toBeNull();
    expect(overlay.querySelector('.cdk-overlay-connected-position-bounding-box')).not.toBeNull();
    expect(overlay.querySelector('.cdk-overlay-backdrop')).toBeNull();
    expect(globalWrapper(overlay)).toBeNull();
  });

  it('compact 에서는 화면 하단의 바텀시트로 연다', async () => {
    const overlay = await open('compact');
    const wrapper = globalWrapper(overlay);

    expect(overlay.querySelector('hlm-calendar')).not.toBeNull();
    expect(wrapper?.style.alignItems).toBe('flex-end');
    expect(wrapper?.style.justifyContent).toBe('center');
    expect(overlay.querySelector('.cdk-overlay-backdrop')).not.toBeNull();
    expect(overlay.querySelector('.cdk-overlay-connected-position-bounding-box')).toBeNull();
  });

  it('포인터 쿼리가 모두 false 여도 넓으면 팝오버로 연다', async () => {
    const overlay = await open({
      '(min-width: 48rem)': true,
      '(pointer: fine)': false,
      '(hover: hover)': false,
      '(any-pointer: fine)': false,
      '(any-hover: hover)': false,
    });

    expect(overlay.querySelector('.cdk-overlay-connected-position-bounding-box')).not.toBeNull();
    expect(overlay.querySelector('.cdk-overlay-backdrop')).toBeNull();
  });

  it('다시 누르면 닫는다', async () => {
    const { fixture, trigger } = await render('wide');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('트리거가 지정한 id 와 오버레이 연결을 유지한다', async () => {
    const { fixture, trigger } = await render('wide', 'task-due');
    fixture.detectChanges();

    expect(trigger.id).toBe('task-due');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-controls')).toBeTruthy();
  });
});

@Component({
  selector: 'app-host',
  imports: [HlmDatePicker, HlmDatePickerTrigger],
  template: `
    <hlm-date-picker>
      <hlm-date-picker-trigger [buttonId]="buttonId">정하지 않음</hlm-date-picker-trigger>
    </hlm-date-picker>
  `,
})
class Host {
  buttonId = 'hlm-date-picker-spec';
}

type Viewport = 'wide' | 'compact';

function withViewportClass(source: Viewport | Record<string, boolean>) {
  const breakpoints =
    typeof source === 'string' ? { '(min-width: 48rem)': source === 'wide' } : source;

  return {
    provide: BreakpointObserver,
    useValue: {
      observe: (query: string | readonly string[]) => {
        const queries = typeof query === 'string' ? [query] : query;
        return of({ matches: queries.some((q) => breakpoints[q] === true), breakpoints });
      },
    },
  };
}

async function render(
  source: Viewport | Record<string, boolean>,
  buttonId?: string,
): Promise<{
  fixture: ComponentFixture<Host>;
  trigger: HTMLButtonElement;
}> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [withViewportClass(source)] });

  const fixture = TestBed.createComponent(Host);
  if (buttonId) fixture.componentInstance.buttonId = buttonId;
  fixture.detectChanges();
  await fixture.whenStable();

  const trigger = (fixture.nativeElement as HTMLElement).querySelector('button');
  if (!trigger) throw new Error('날짜 선택 트리거를 찾지 못했습니다');

  trigger.click();
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, trigger };
}

async function open(source: Viewport | Record<string, boolean>): Promise<HTMLElement> {
  await render(source);
  return TestBed.inject(OverlayContainer).getContainerElement();
}

function globalWrapper(overlay: HTMLElement): HTMLElement | null {
  return overlay.querySelector<HTMLElement>('.cdk-global-overlay-wrapper');
}
