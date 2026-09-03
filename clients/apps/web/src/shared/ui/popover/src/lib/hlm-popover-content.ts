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

    // 뷰포트 너비에 따라 데스크톱은 팝오버로, 모바일은 하단 시트로 렌더링한다.
    classes(() => [
      SURFACE_BASE,
      this._presentation.compact() ? HLM_POPOVER_SURFACE_COMPACT : HLM_POPOVER_SURFACE_WIDE,
    ]);
  }
}

const SURFACE_BASE =
  'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 ring-foreground/10 relative flex flex-col gap-4 p-4 text-sm ring-1 duration-100 outline-none';
