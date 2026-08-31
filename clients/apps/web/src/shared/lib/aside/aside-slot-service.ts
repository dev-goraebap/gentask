import { Injectable, signal, TemplateRef } from '@angular/core';

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
