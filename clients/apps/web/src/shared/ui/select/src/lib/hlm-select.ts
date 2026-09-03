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
    // 모바일 시트 변환 규칙을 유지하기 위해 자체 팝오버 컴포넌트를 사용한다.
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
