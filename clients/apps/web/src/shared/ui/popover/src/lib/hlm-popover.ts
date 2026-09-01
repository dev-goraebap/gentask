import { Directive, effect, forwardRef } from '@angular/core';
import { BrnOverlay, type BrnOverlayDefaultOptions } from '@spartan-ng/brain/overlay';
import { BrnPopover } from '@spartan-ng/brain/popover';
import { injectHlmPopoverPresentation } from './hlm-popover-presentation';

/**
 * 넓은 화면에서 트리거 옆에 붙어 뜨고, 좁은 화면에서는 아래에서 올라오는 시트가 됩니다.
 *
 * <p>자리마다 정하지 않는 것이 요점입니다. 팝오버를 쓰는 것은 전부 이 규칙을 따르므로 새 고르개를
 * 만들 때 다시 판단하지 않습니다. 규약은 프론트엔드 05 의 8절이 갖습니다.
 *
 * <p>Spartan 이 준 것을 감싸지 않고 물려받은 이유는 갈아 끼울 자리가 <b>보호된 메서드</b>이기
 * 때문입니다. `hostDirectives` 로는 감싼 쪽이 그 메서드에 닿지 못합니다.
 */
@Directive({
  selector: '[hlmPopover],hlm-popover',
  exportAs: 'hlmPopover',
  // 물려받은 것은 부모의 토큰으로 서지 않으므로 직접 잇는다. 트리거가 `BrnOverlay` 로 팝오버를
  // 찾고(없으면 단추를 눌러도 아무 일도 일어나지 않는다), 데이트피커가 `BrnPopover` 로 찾는다
  // (없으면 NG0951 로 뷰 질의가 비어 터진다).
  providers: [
    { provide: BrnOverlay, useExisting: forwardRef(() => HlmPopover) },
    { provide: BrnPopover, useExisting: forwardRef(() => HlmPopover) },
  ],
  host: { 'data-slot': 'popover' },
})
export class HlmPopover extends BrnPopover {
  private readonly _presentation = injectHlmPopoverPresentation();

  constructor() {
    super();

    // 뒤를 덮는 판의 존재가 아니라 그 **모습**을 화면 폭에 맡긴다. 존재를 맡기면 따라오지 않는다 —
    // `hasBackdrop` 은 입력의 초기값으로 한 번만 읽히므로, 폭이 바뀌어도 새로 세우기 전까지 그
    // 자리에 남는다. 모습은 열려 있는 중에도 갈아 끼울 수 있어 그 자리가 항상 지금 폭을 따른다.
    effect(() => this.setOverlayClass(this._presentation.compact() ? SHEET : INERT));
  }

  /**
   * 뒤를 덮는 판을 항상 둡니다. 넓은 화면에서는 투명하고 클릭이 통과하므로 없는 것과 같습니다.
   *
   * <p>바깥을 눌러 닫는 길은 이것과 무관합니다 — 그 판정은 백드롭이 아니라 오버레이 바깥의 포인터
   * 사건이 갖습니다.
   */
  protected override getDefaultOptions(): BrnOverlayDefaultOptions {
    return { ...super.getDefaultOptions(), hasBackdrop: true };
  }

  /**
   * 좁은 화면에서는 트리거를 잊고 화면 아래에 붙습니다.
   *
   * <p>열릴 때마다 읽히므로 뜨는 자리는 그 순간의 화면 폭을 따릅니다.
   */
  protected override getPositionStrategy() {
    return this._presentation.positionStrategy() ?? super.getPositionStrategy();
  }
}

/** 좁은 화면. 뒤를 덮어 시트가 그 위에 선 것을 보인다. */
const SHEET = 'bg-veil';

/**
 * 넓은 화면. 투명한 채로 클릭을 통과시킨다.
 *
 * <p>`!` 가 필요한 이유는 CDK 가 `.cdk-overlay-backdrop` 에 `pointer-events: auto` 를 박아 두었고
 * 둘의 특정도가 같기 때문이다. 순서에 기대면 빌드에 따라 갈린다.
 */
const INERT = 'pointer-events-none!';
