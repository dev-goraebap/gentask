import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { HlmDatePicker } from './hlm-date-picker';
import { HlmDatePickerTrigger } from './hlm-date-picker-trigger';

/*
 * 적응형 컴포넌트라 두 폭을 각각 고정합니다. 한쪽만 검증하면 다른 쪽은 실제 화면에서만
 * 드러납니다. 07-adaptive-ui.md 9절, 17-testing.md 3.1절.
 *
 * 위치 전략은 사용자가 보는 결과이지만 역할이나 접근 가능한 이름으로는 드러나지
 * 않으므로 CDK 가 만든 오버레이 구조로 판정합니다. 연결 위치 전략은 트리거를 기준으로
 * 하는 바운딩 박스를, 전역 위치 전략은 정렬 값을 가진 래퍼를 만듭니다.
 */
describe('HlmDatePicker', () => {
  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('wide 에서는 트리거에 연결된 팝오버로 연다', async () => {
    const overlay = await open('wide');

    expect(overlay.querySelector('hlm-calendar')).not.toBeNull();
    expect(overlay.querySelector('.cdk-overlay-connected-position-bounding-box')).not.toBeNull();
    // 백드롭은 화면을 덮어 뒤쪽 조작을 막습니다. 마우스 사용자에게는 방해입니다.
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
    /*
     * 마우스가 연결되어 동작하는데도 브라우저가 포인터 축을 전부 false 로 보고한
     * 실측 환경입니다. 그 값을 판정에 쓰면 데스크탑에 시트가 뜹니다. 07-adaptive-ui.md 2절.
     */
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
    // 레이블이 이 id 를 가리킵니다. brain 트리거를 바꿔 끼울 때 가장 먼저 깨지는 배선입니다.
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

/**
 * 17-testing.md 3.2절의 대체 구현입니다.
 *
 * 쿼리별 응답을 맵으로 받는 이유는 판정이 어느 쿼리를 보는지까지 고정하기 위해서입니다.
 * 폭만 참으로 두고 포인터 축을 전부 거짓으로 두면, 판정이 포인터를 보는 순간 실패합니다.
 */
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
