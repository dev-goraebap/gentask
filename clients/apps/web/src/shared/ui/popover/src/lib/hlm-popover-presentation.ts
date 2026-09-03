import { OverlayPositionBuilder, type PositionStrategy } from '@angular/cdk/overlay';
import { computed, inject, type Signal } from '@angular/core';
import { injectViewportClass } from '@/shared/lib';

/**
 * 반응형 팝오버 및 바텀 시트 화면 전환 설정이다.
 */
export interface HlmPopoverPresentation {
  readonly viewport: Signal<'wide' | 'compact'>;

  /** 모바일 화면 하단 고정 위치 전략이다. 데스크톱에서는 null을 반환한다. */
  readonly positionStrategy: Signal<PositionStrategy | null>;

  readonly compact: Signal<boolean>;
}

export function injectHlmPopoverPresentation(): HlmPopoverPresentation {
  const viewport = injectViewportClass();
  const positionBuilder = inject(OverlayPositionBuilder);

  return {
    viewport,
    compact: computed(() => viewport() === 'compact'),
    positionStrategy: computed(() =>
      viewport() === 'compact' ? positionBuilder.global().bottom('0').centerHorizontally() : null,
    ),
  };
}

/** 데스크톱 팝오버 패널 스타일이다. */
export const HLM_POPOVER_SURFACE_WIDE =
  'w-72 rounded-md shadow-md data-open:zoom-in-95 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2';

/**
 * 모바일 바텀 시트 패널 스타일이다. 하단 안전 영역(safe-area)을 포함한다.
 */
export const HLM_POPOVER_SURFACE_COMPACT =
  'w-screen max-w-screen overscroll-contain rounded-t-xl pb-[env(safe-area-inset-bottom)] shadow-lg data-open:slide-in-from-bottom-4 data-closed:slide-out-to-bottom-4';
