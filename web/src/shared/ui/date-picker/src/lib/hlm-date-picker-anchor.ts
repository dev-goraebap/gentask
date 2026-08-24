import { Directive, effect, ElementRef, inject, input, linkedSignal } from '@angular/core';
import { BrnOverlay } from '@spartan-ng/brain/overlay';
import { BrnPopover } from '@spartan-ng/brain/popover';
import { injectViewportClass } from '@/shared/lib';

@Directive({ selector: '[hlmDatePickerAnchor]' })
export class HlmDatePickerAnchor {
  private readonly _host = inject(ElementRef, { host: true });
  private readonly _brnOverlay = inject(BrnOverlay, { optional: true });
  private readonly _viewport = injectViewportClass();

  public readonly hlmDatePickerAnchorForInput = input<BrnPopover | undefined>(undefined, {
    alias: 'hlmDatePickerAnchorFor',
  });

  public readonly hlmDatePickerAnchorFor = linkedSignal(this.hlmDatePickerAnchorForInput);

  constructor() {
    effect(() => {
      const origin = this._viewport() === 'compact' ? null : this._host.nativeElement;
      this.hlmDatePickerAnchorFor()?.setOrigin(origin);
      this._brnOverlay?.setOrigin(origin);
    });
  }
}
