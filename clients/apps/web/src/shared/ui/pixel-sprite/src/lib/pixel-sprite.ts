import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * 가로로 이어 붙인 시트를 한 칸씩 넘겨 그리는 자리.
 *
 * <p>재생은 CSS 가 한다. 자바스크립트로 프레임을 넘기면 매 프레임 변경 감지가 돌지만, 배경 위치를
 * 옮기는 애니메이션은 브라우저가 알아서 돌리므로 이 컴포넌트는 처음 한 번만 일한다.
 *
 * <p><b>무엇이 그려지는지는 이 컴포넌트가 알지 못한다.</b> 시트의 자리와 칸 수만 받는다. 팻이든
 * 다른 무엇이든 같은 규격의 시트이면 그린다.
 */
@Component({
  selector: 'app-pixel-sprite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-sprite',
    // 그림일 뿐 읽어 줄 것이 없다. 뜻을 담아야 하는 자리는 쓰는 쪽이 글자로 적는다.
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

  /** 시트가 있는 자리. `public` 아래의 절대 경로다. */
  readonly sheet = input.required<string>();

  /** 시트에 담긴 칸 수. 시트의 가로 길이는 이 수와 한 칸의 곱이어야 한다. */
  readonly frames = input.required<number>();

  /** 한 칸의 원래 크기. 그린 격자가 24 이므로 기본이 24 다. */
  readonly unit = input(24);

  /**
   * 몇 배로 키울 것인가.
   *
   * <p><b>정수만 받는다.</b> 1.5 배로 늘리면 한 화소가 한 화소 반이 되어 가장자리가 뭉갠다. 픽셀
   * 그림은 정수배에서만 제 모양을 지킨다.
   */
  readonly scale = input(2);

  /** 한 바퀴에 걸리는 시간(밀리초). 그린 것이 칸마다 140ms 이므로 여섯 칸이면 840 이다. */
  readonly duration = input(840);

  // --- 파생 --------------------------------------------------------------------------------------

  protected readonly sheetValue = computed(() => `url('${this.sheet()}')`);

  protected readonly sizeValue = computed(() => `${this.unit() * Math.round(this.scale())}px`);

  protected readonly durationValue = computed(() => `${this.duration()}ms`);
}
