import { OverlayPositionBuilder, type PositionStrategy } from '@angular/cdk/overlay';
import { computed, inject, type Signal } from '@angular/core';
import { injectViewportClass } from '@/shared/lib';
import { hlm } from '@/shared/ui/utils';

export interface HlmDatePickerPresentation {
  readonly viewport: Signal<'wide' | 'compact'>;
  readonly positionStrategy: Signal<PositionStrategy | null>;
  readonly hasBackdrop: Signal<boolean>;
  readonly surfaceClass: Signal<string>;
}

export function injectHlmDatePickerPresentation(): HlmDatePickerPresentation {
  const viewport = injectViewportClass();
  const positionBuilder = inject(OverlayPositionBuilder);

  const positionStrategy = computed<PositionStrategy | null>(() =>
    viewport() === 'compact' ? positionBuilder.global().bottom('0').centerHorizontally() : null,
  );

  return {
    viewport,
    positionStrategy,
    hasBackdrop: computed(() => viewport() === 'compact'),
    surfaceClass: computed(() =>
      hlm(SURFACE_BASE, viewport() === 'compact' ? SURFACE_COMPACT : SURFACE_WIDE),
    ),
  };
}

const SURFACE_BASE =
  'bg-popover text-popover-foreground ring-foreground/10 relative flex flex-col overflow-hidden text-sm ring-1 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0';

const SURFACE_WIDE = 'w-fit rounded-md shadow-md data-open:zoom-in-95 data-closed:zoom-out-95';

const SURFACE_COMPACT =
  'w-screen items-center overscroll-contain rounded-t-xl pb-[env(safe-area-inset-bottom)] shadow-lg data-open:slide-in-from-bottom-4 data-closed:slide-out-to-bottom-4';
