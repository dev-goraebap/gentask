import { Directive, inject, Injectable, type OnDestroy, signal, TemplateRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AsideSlot {
  private readonly state = signal<TemplateRef<unknown> | null>(null);

  readonly content = this.state.asReadonly();

  set(template: TemplateRef<unknown>): void {
    this.state.set(template);
  }

  clear(template: TemplateRef<unknown>): void {
    if (this.state() === template) this.state.set(null);
  }
}

@Directive({ selector: '[appAside]' })
export class AsideOutlet implements OnDestroy {
  private readonly slot = inject(AsideSlot);
  private readonly template = inject<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    this.slot.set(this.template);
  }

  ngOnDestroy(): void {
    this.slot.clear(this.template);
  }
}
