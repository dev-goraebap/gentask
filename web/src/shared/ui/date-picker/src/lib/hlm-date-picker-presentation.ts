import { OverlayPositionBuilder, type PositionStrategy } from '@angular/cdk/overlay';
import { computed, inject, type Signal } from '@angular/core';
import { injectViewportClass } from '@/shared/lib';
import { hlm } from '@/shared/ui/utils';

/**
 * 날짜 선택 오버레이의 표현을 뷰포트 폭에 따라 정합니다.
 *
 * wide 는 트리거에 붙는 팝오버, compact 는 화면 하단의 바텀시트입니다. 캘린더 DOM 은
 * 두 경우가 같고 오버레이의 위치 전략과 표면 클래스만 바뀝니다. 패턴 A 이며 근거는
 * docs/architecture/references/07-adaptive-ui.md 4.2절입니다.
 *
 * 네 종류의 날짜 선택기가 같은 오버레이 규격을 쓰므로 판정과 클래스를 여기 한 곳에
 * 둡니다. 표현이 갈리는 지점이 늘어나면 이 파일만 고칩니다.
 */
export interface HlmDatePickerPresentation {
  /** 현재 뷰포트 폭 판정. 트리거의 오리진 결정에도 같은 값이 필요합니다. */
  readonly viewport: Signal<'wide' | 'compact'>;
  /** compact 에서만 값을 갖습니다. null 이면 brain 이 트리거 연결 전략을 씁니다. */
  readonly positionStrategy: Signal<PositionStrategy | null>;
  /** 시트는 모달이므로 백드롭을 깔고, 팝오버는 깔지 않습니다. */
  readonly hasBackdrop: Signal<boolean>;
  /** 오버레이 내부 표면의 클래스. */
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

/** 트리거 옆에 뜨므로 내용 크기를 따르고 네 모서리를 굴립니다. */
const SURFACE_WIDE = 'w-fit rounded-md shadow-md data-open:zoom-in-95 data-closed:zoom-out-95';

/*
 * 하단에 붙는 전체 폭 시트입니다. 오버레이 판(pane)은 내용 크기를 따르므로 폭을
 * 여기서 뷰포트로 고정해야 판까지 함께 늘어납니다. 하단 여백은 홈바를 피합니다.
 * safe area 규칙은 07-adaptive-ui.md 8절입니다.
 */
const SURFACE_COMPACT =
  'w-screen items-center overscroll-contain rounded-t-xl pb-[env(safe-area-inset-bottom)] shadow-lg data-open:slide-in-from-bottom-4 data-closed:slide-out-to-bottom-4';
