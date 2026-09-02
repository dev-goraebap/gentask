import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { diffLines, type DiffMark } from '@/entities/doc';

interface DiffRow {
  readonly text: string;
  /** 눈으로 읽는 부호. 색을 가리지 못하는 눈에도 어느 쪽인지가 남아야 한다. */
  readonly sign: string;
  /** 소리로 읽는 이름. 부호는 그림이라 읽히지 않는다. */
  readonly label: string;
  readonly added: boolean;
  readonly removed: boolean;
  readonly fromNo: string;
  readonly toNo: string;
}

const FACES: Record<DiffMark, { readonly sign: string; readonly label: string }> = {
  same: { sign: ' ', label: '' },
  added: { sign: '+', label: '더한 줄' },
  removed: { sign: '-', label: '지운 줄' },
};

/**
 * 두 개정의 다른 자리를 짚는 자리(DOC-004 A1).
 *
 * <p>서버는 차이를 내지 않는다. 본문 둘을 받아 이 자리가 센다.
 *
 * <p>본문을 마크다운으로 그리지 않는다. 무엇이 어떻게 <b>적혔는지</b>가 견주는 대상이므로, 그려 놓고
 * 견주면 서식이 같은 두 줄이 같은 줄로 보인다.
 */
@Component({
  selector: 'app-doc-diff-view',
  templateUrl: './doc-diff-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocDiffView {
  // --- 계약 --------------------------------------------------------------------------------------
  /** 지난 쪽의 본문. 부르는 쪽이 두 개정의 앞뒤를 이미 가려서 넘긴다. */
  readonly from = input.required<string>();
  readonly to = input.required<string>();
  readonly fromLabel = input.required<string>();
  readonly toLabel = input.required<string>();

  // --- 파생 --------------------------------------------------------------------------------------
  private readonly result = computed(() => diffLines(this.from(), this.to()));

  protected readonly rows = computed<readonly DiffRow[]>(() =>
    this.result().lines.map((line) => {
      const face = FACES[line.mark];
      return {
        text: line.text,
        sign: face.sign,
        label: face.label,
        added: line.mark === 'added',
        removed: line.mark === 'removed',
        fromNo: line.fromNo === null ? '' : String(line.fromNo),
        toNo: line.toNo === null ? '' : String(line.toNo),
      };
    }),
  );

  protected readonly summary = computed(() => {
    const { addedCount, removedCount } = this.result();
    if (addedCount === 0 && removedCount === 0) return '다른 줄이 없습니다';
    return `${removedCount}줄을 지우고 ${addedCount}줄을 더했습니다`;
  });

  protected readonly tooLarge = computed(() => this.result().tooLarge);
}
