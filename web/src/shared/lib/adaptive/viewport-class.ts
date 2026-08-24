import { BreakpointObserver } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';
import { computed, inject, PLATFORM_ID, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

export function injectViewportClass(): Signal<'wide' | 'compact'> {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const observer = inject(BreakpointObserver);
  const state = toSignal(observer.observe(WIDE), { initialValue: null });

  return computed(() => {
    if (!isBrowser) return 'wide';

    return state()?.matches ? 'wide' : 'compact';
  });
}

const WIDE = '(min-width: 48rem)';
