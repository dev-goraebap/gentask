import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { IssueCreateForm } from './issue-create-form';

/**
 * 덮개 안에 서는 껍데기.
 *
 * <p>나가는 길은 하나인데 그 모습이 화면 폭에 따라 갈린다. 넓은 화면에서는 뒤에 목록이 남아 보이는
 * 상자이므로 오른쪽의 닫기가 맞고, 좁은 화면에서는 덮개가 셸까지 덮어 앞 단계가 보이지 않으므로
 * 왼쪽의 돌아가기가 맞다. 셸의 좁은 화면 머리가 쓰는 것과 같은 어휘다.
 */
@Component({
  selector: 'app-issue-create-dialog',
  imports: [HlmButton, AppIcon, IssueCreateForm],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    <header class="border-border flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <button
        hlmBtn
        type="button"
        variant="ghost"
        size="icon-sm"
        class="rounded-(--radius-nav) -ml-2 md:hidden"
        aria-label="앞 단계로 돌아가기"
        (click)="dismissed.emit()"
      >
        <app-icon name="hgiArrowLeft" />
      </button>

      <h2 class="flex-1 text-base font-semibold tracking-tight">새 작업 아이템</h2>

      <button
        hlmBtn
        type="button"
        variant="ghost"
        size="icon-sm"
        class="rounded-(--radius-nav) max-md:hidden"
        aria-label="닫기"
        (click)="dismissed.emit()"
      >
        <app-icon name="hgiCancel" />
      </button>
    </header>

    <app-issue-create-form (created)="created.emit($event)" (dismissed)="dismissed.emit()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueCreateDialog {
  // --- 계약 --------------------------------------------------------------------------------------
  readonly created = output<string>();
  readonly dismissed = output<void>();
}
