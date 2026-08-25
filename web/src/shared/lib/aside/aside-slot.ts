import { Directive, inject, Injectable, type OnDestroy, signal, TemplateRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AsideSlotService {
  // --- 상태 --------------------------------------------------------------------------------------
  private readonly state = signal<TemplateRef<unknown> | null>(null);
  readonly content = this.state.asReadonly();

  // --- 동작 --------------------------------------------------------------------------------------
  set(template: TemplateRef<unknown>): void {
    this.state.set(template);
  }

  clear(template: TemplateRef<unknown>): void {
    if (this.state() === template) this.state.set(null);
  }
}

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
