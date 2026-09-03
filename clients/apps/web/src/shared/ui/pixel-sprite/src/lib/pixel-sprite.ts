import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * 가로 스프라이트 이미지 시트를 순차 렌더링하는 픽셀 애니메이션 컴포넌트다.
 */
@Component({
  selector: 'app-pixel-sprite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-sprite',
    // 순수 시각 장식용 이미지이므로 스크린 리더용 대체 텍스트를 제공하지 않는다.
    'aria-hidden': 'true',
    '[style.--pixel-sprite-sheet]': 'sheetValue()',
    '[style.--pixel-sprite-frames]': 'frames()',
    '[style.--pixel-sprite-px]': 'sizeValue()',
    '[style.--pixel-sprite-duration]': 'durationValue()',
  },
  template: '',
})
export class PixelSprite {
  // --- 계약 --------------------------------------------------------------------------------------

  /** 스프라이트 이미지의 공용 절대 경로다. */
  readonly sheet = input.required<string>();

  /** 스프라이트 시트의 총 프레임 수다. */
  readonly frames = input.required<number>();

  /** 스프라이트 1프레임의 기본 픽셀 크기(기본값 24px)다. */
  readonly unit = input(24);

  /**
   * 픽셀 왜곡을 방지하기 위해 정수 배율만 지원한다.
   */
  readonly scale = input(2);

  /** 전체 애니메이션 1회 재생 시간(밀리초)이다. */
  readonly duration = input(840);

  // --- 파생 --------------------------------------------------------------------------------------

  protected readonly sheetValue = computed(() => `url('${this.sheet()}')`);

  protected readonly sizeValue = computed(() => `${this.unit() * Math.round(this.scale())}px`);

  protected readonly durationValue = computed(() => `${this.duration()}ms`);
}
