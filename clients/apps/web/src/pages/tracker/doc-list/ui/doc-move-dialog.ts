import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { HlmAlertDialog, HlmAlertDialogImports } from '@/shared/ui/alert-dialog';
import { HlmButton } from '@/shared/ui/button';
import type { DocMoveTarget } from '../lib/move-targets';

/**
 * 옮길 자리를 고르는 덮개(DOC-006 · DOC-008 A5).
 *
 * 고르는 것이 곧 옮기는 것이다. 고르고 나서 한 번 더 누르게 하면 무엇이 달라지는지를 말하지 않는
 * 단계가 하나 늘 뿐이다. 그만두면 아무것도 하지 않는다(DOC-006 A3).
 */
@Component({
  selector: 'app-doc-move-dialog',
  imports: [HlmAlertDialogImports, HlmButton],
  templateUrl: './doc-move-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocMoveDialog {
  // --- 계약 --------------------------------------------------------------------------------------
  /** 무엇을 옮기는가. 소리로 읽는 이름이 줄마다 갈리므로 부르는 쪽이 준다. */
  readonly label = input.required<string>();

  readonly targets = input.required<readonly DocMoveTarget[]>();

  readonly chosen = output<string | null>();

  // --- 질의 --------------------------------------------------------------------------------------
  private readonly dialog = viewChild.required(HlmAlertDialog);

  // --- 동작 --------------------------------------------------------------------------------------
  protected choose(target: DocMoveTarget): void {
    this.dialog().close();
    this.chosen.emit(target.id);
  }
}
