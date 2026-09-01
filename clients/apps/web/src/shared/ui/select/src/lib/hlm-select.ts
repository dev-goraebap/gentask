import { Directive } from '@angular/core';
import { provideBrnPopoverConfig, provideBrnPopoverDefaultOptions } from '@spartan-ng/brain/popover';
import { BrnSelect } from '@spartan-ng/brain/select';
import { HlmPopover } from '@/shared/ui/popover';
import { classes } from '@/shared/ui/utils';

@Directive({
  selector: '[hlmSelect],hlm-select',
  providers: [
    provideBrnPopoverConfig({
      align: 'start',
      sideOffset: 6,
    }),
    provideBrnPopoverDefaultOptions({ role: null }),
  ],
  hostDirectives: [
    {
      directive: BrnSelect,
      inputs: ['disabled', 'value', 'isItemEqualToValue', 'itemToString'],
      outputs: ['valueChange'],
    },
    // `BrnPopover` 가 아니라 우리 팝오버를 문다. 좁은 화면에서 시트가 되는 규칙이 거기 있으므로,
    // 뿌리를 갈면 셀렉트가 그 규칙에서 빠진다.
    {
      directive: HlmPopover,
      inputs: ['align', 'closeOnOutsidePointerEvents', 'sideOffset', 'state', 'offsetX'],
      outputs: ['stateChanged', 'closed'],
    },
  ],
  host: { 'data-slot': 'select' },
})
export class HlmSelect {
  constructor() {
    classes(() => 'block');
  }
}
