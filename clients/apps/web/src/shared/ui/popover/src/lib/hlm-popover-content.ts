import { Directive, ElementRef, Renderer2, effect, inject, signal } from '@angular/core';
import { injectExposesStateProvider } from '@spartan-ng/brain/core';
import { classes } from '@/shared/ui/utils';
import {
  HLM_POPOVER_SURFACE_COMPACT,
  HLM_POPOVER_SURFACE_WIDE,
  injectHlmPopoverPresentation,
} from './hlm-popover-presentation';

@Directive({
  selector: '[hlmPopoverContent],hlm-popover-content',
  host: { 'data-slot': 'popover-content' },
})
export class HlmPopoverContent {
  private readonly _stateProvider = injectExposesStateProvider({ host: true });
  public state = this._stateProvider.state ?? signal('closed');
  private readonly _renderer = inject(Renderer2);
  private readonly _element = inject(ElementRef);
  private readonly _presentation = injectHlmPopoverPresentation();

  constructor() {
    effect(() => {
      this._renderer.setAttribute(this._element.nativeElement, 'data-state', this.state());
    });

    // 판이 뜨는 자리가 화면 폭에 따라 갈리므로 그 모양도 함께 갈린다. 트리거 옆에 붙은 것은 제 폭을
    // 갖고 사방이 둥글고, 아래에 붙은 것은 화면을 채우고 위쪽만 둥글다.
    classes(() => [
      SURFACE_BASE,
      this._presentation.compact() ? HLM_POPOVER_SURFACE_COMPACT : HLM_POPOVER_SURFACE_WIDE,
    ]);
  }
}

const SURFACE_BASE =
  'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 ring-foreground/10 relative flex flex-col gap-4 p-4 text-sm ring-1 duration-100 outline-none';
