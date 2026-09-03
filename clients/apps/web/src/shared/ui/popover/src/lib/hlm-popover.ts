import { Directive, effect, forwardRef } from '@angular/core';
import { BrnOverlay, type BrnOverlayDefaultOptions } from '@spartan-ng/brain/overlay';
import { BrnPopover } from '@spartan-ng/brain/popover';
import { injectHlmPopoverPresentation } from './hlm-popover-presentation';

/**
 * 화면 너비에 따라 데스크톱에서는 트리거 기준 팝오버로, 모바일에서는 하단 바텀 시트로 전환되는 팝오버 디렉티브다.
 * 상속 컴포넌트의 protected 메서드 재정의를 위해 기본 Spartan Popover를 확장한다.
 */
@Directive({
  selector: '[hlmPopover],hlm-popover',
  exportAs: 'hlmPopover',
  // 상속 컴포넌트의 DI 주입을 위해 필요한 토큰을 직접 연결한다.
  providers: [
    { provide: BrnOverlay, useExisting: forwardRef(() => HlmPopover) },
    { provide: BrnPopover, useExisting: forwardRef(() => HlmPopover) },
  ],
  host: { 'data-slot': 'popover' },
})
export class HlmPopover extends BrnPopover {
  private readonly _presentation = injectHlmPopoverPresentation();

  constructor() {
    super();

    // 반응형 대응을 위해 화면 너비에 따라 백드롭 스타일 클래스를 동적으로 전환한다.
    effect(() => this.setOverlayClass(this._presentation.compact() ? SHEET : INERT));
  }

  /**
   * 백드롭을 상시 유지하며 데스크톱에서는 투명 클릭 관통 스타일을 적용한다.
   */
  protected override getDefaultOptions(): BrnOverlayDefaultOptions {
    return { ...super.getDefaultOptions(), hasBackdrop: true };
  }

  /**
   * 모바일 화면에서는 화면 하단에 고정되는 위치 전략을 적용한다.
   */
  protected override getPositionStrategy() {
    return this._presentation.positionStrategy() ?? super.getPositionStrategy();
  }
}

/** 모바일 바텀 시트용 딤 백드롭 스타일이다. */
const SHEET = 'bg-veil';

/**
 * 데스크톱 팝오버용 투명 백드롭 스타일이다. 클릭 이벤트를 관통시키기 위해 !pointer-events-none을 적용한다.
 */
const INERT = 'pointer-events-none!';
