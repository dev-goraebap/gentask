import { Directive, inject, type OnDestroy, TemplateRef } from '@angular/core';

import { AsideSlotService } from './aside-slot-service';

@Directive({ selector: '[appAside]' })
export class AsideOutlet implements OnDestroy {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly asideSlotService = inject(AsideSlotService);
  private readonly template = inject<TemplateRef<unknown>>(TemplateRef);

  // --- 생성 --------------------------------------------------------------------------------------
  constructor() {
    this.asideSlotService.set(this.template);
  }

  ngOnDestroy(): void {
    this.asideSlotService.clear(this.template);
  }
}
