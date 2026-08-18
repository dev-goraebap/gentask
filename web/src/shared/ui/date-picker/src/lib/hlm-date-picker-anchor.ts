import { Directive, effect, ElementRef, inject, input, linkedSignal } from '@angular/core';
import { BrnOverlay } from '@spartan-ng/brain/overlay';
import { BrnPopover } from '@spartan-ng/brain/popover';
import { injectInteractionMode } from '@/shared/lib';

@Directive({ selector: '[hlmDatePickerAnchor]' })
export class HlmDatePickerAnchor {
  private readonly _host = inject(ElementRef, { host: true });
  private readonly _brnOverlay = inject(BrnOverlay, { optional: true });
  private readonly _mode = injectInteractionMode();

  public readonly hlmDatePickerAnchorForInput = input<BrnPopover | undefined>(undefined, {
    alias: 'hlmDatePickerAnchorFor',
  });

  public readonly hlmDatePickerAnchorFor = linkedSignal(this.hlmDatePickerAnchorForInput);

  constructor() {
    /*
     * touch 에서는 오리진을 비웁니다. 오리진이 붙어 있으면 팝오버가 `positionStrategy`
     * 입력을 무시하므로 바텀시트가 열리지 않습니다. 07-adaptive-ui.md 4.2절.
     */
    effect(() => {
      const origin = this._mode() === 'touch' ? null : this._host.nativeElement;
      this.hlmDatePickerAnchorFor()?.setOrigin(origin);
      this._brnOverlay?.setOrigin(origin);
    });
  }
}
