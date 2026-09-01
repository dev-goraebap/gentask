import { OverlayPositionBuilder, type PositionStrategy } from '@angular/cdk/overlay';
import { computed, inject, type Signal } from '@angular/core';
import { injectViewportClass } from '@/shared/lib';

/**
 * 팝오버가 좁은 화면에서 시트가 되기 위해 갈아 끼우는 것들.
 *
 * <p>넓은 화면에서 트리거에 붙어 뜨는 것은 좁은 화면에서 아래에서 올라오는 시트가 됩니다. 자리마다
 * 정하지 않고 팝오버 층이 갖는 규칙이므로, 팝오버를 쓰는 것은 전부 이것을 따릅니다. 근거와 규약은
 * <a href="../../../../../../../docs/architecture/concepts/frontend-05-design-system.md">프론트엔드 05</a>
 * 8절이 갖습니다.
 */
export interface HlmPopoverPresentation {
  readonly viewport: Signal<'wide' | 'compact'>;

  /** 좁은 화면에서만 값을 갖습니다. 넓은 화면은 트리거에 붙는 기존 전략을 그대로 씁니다. */
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

/** 넓은 화면의 판. 트리거 옆에 뜨므로 제 폭을 갖고 사방이 둥급니다. */
export const HLM_POPOVER_SURFACE_WIDE =
  'w-72 rounded-md shadow-md data-open:zoom-in-95 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2';

/**
 * 좁은 화면의 시트. 화면 폭을 채우고 아래에 붙으므로 위쪽만 둥글고, 가려지는 아래 여백을
 * `safe-area-inset-bottom` 이 갖습니다.
 */
export const HLM_POPOVER_SURFACE_COMPACT =
  'w-screen max-w-screen overscroll-contain rounded-t-xl pb-[env(safe-area-inset-bottom)] shadow-lg data-open:slide-in-from-bottom-4 data-closed:slide-out-to-bottom-4';
