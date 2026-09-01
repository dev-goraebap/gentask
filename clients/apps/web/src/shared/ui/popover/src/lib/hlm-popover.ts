import { Directive, forwardRef } from '@angular/core';
import { BrnOverlay, type BrnOverlayDefaultOptions } from '@spartan-ng/brain/overlay';
import { BrnPopover } from '@spartan-ng/brain/popover';
import { injectViewportClass } from '@/shared/lib';
import { injectHlmPopoverPresentation } from './hlm-popover-presentation';

/**
 * 넓은 화면에서 트리거 옆에 붙어 뜨고, 좁은 화면에서는 아래에서 올라오는 시트가 됩니다.
 *
 * <p>자리마다 정하지 않는 것이 요점입니다. 팝오버를 쓰는 것은 전부 이 규칙을 따르므로 새 고르개를
 * 만들 때 다시 판단하지 않습니다. 규약은 프론트엔드 05 의 8절이 갖습니다.
 *
 * <p>Spartan 이 준 것을 감싸지 않고 물려받은 이유는 갈아 끼울 자리가 <b>보호된 메서드</b>이기
 * 때문입니다. `hostDirectives` 로는 감싼 쪽이 그 메서드에 닿지 못합니다.
 */
@Directive({
  selector: '[hlmPopover],hlm-popover',
  exportAs: 'hlmPopover',
  // 물려받은 것은 부모의 토큰으로 서지 않으므로 직접 잇는다. 트리거가 `BrnOverlay` 로 팝오버를
  // 찾고(없으면 단추를 눌러도 아무 일도 일어나지 않는다), 데이트피커가 `BrnPopover` 로 찾는다
  // (없으면 NG0951 로 뷰 질의가 비어 터진다).
  providers: [
    { provide: BrnOverlay, useExisting: forwardRef(() => HlmPopover) },
    { provide: BrnPopover, useExisting: forwardRef(() => HlmPopover) },
  ],
  host: { 'data-slot': 'popover' },
})
export class HlmPopover extends BrnPopover {
  private readonly _presentation = injectHlmPopoverPresentation();

  /**
   * 좁은 화면에서만 뒤를 덮습니다.
   *
   * <p>`BrnOverlay` 가 <b>필드를 세우는 동안</b> 이것을 부르므로 `_presentation` 은 아직 없습니다.
   * 뷰포트를 여기서 다시 읽는 이유가 그것입니다.
   *
   * <p>여기서 정한 값은 그 자리가 서는 시점에 한 번 읽힙니다. 화면 폭을 실시간으로 끌어 48rem 을
   * 넘나들면 덮개의 유무가 따라오지 않습니다 — 뜨는 자리와 모양은 따라옵니다. 기계가 판정하지
   * 않습니다.
   */
  protected override getDefaultOptions(): BrnOverlayDefaultOptions {
    const compact = injectViewportClass()() === 'compact';

    return {
      ...super.getDefaultOptions(),
      hasBackdrop: compact,
      backdropClass: compact ? 'bg-veil' : '',
    };
  }

  /**
   * 좁은 화면에서는 트리거를 잊고 화면 아래에 붙습니다.
   *
   * <p>열릴 때마다 읽히므로 뜨는 자리는 그 순간의 화면 폭을 따릅니다.
   */
  protected override getPositionStrategy() {
    return this._presentation.positionStrategy() ?? super.getPositionStrategy();
  }
}
