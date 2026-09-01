import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { IssueCreateForm } from './issue-create-form';

/**
 * 덮개 안에 서는 껍데기.
 *
 * <p>나가는 길이 닫기다. 뒤에 목록이 남아 있으므로 돌아갈 곳을 따로 가리키지 않는다.
 */
@Component({
  selector: 'app-issue-create-dialog',
  imports: [HlmButton, AppIcon, IssueCreateForm],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    <header class="border-border flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <h2 class="flex-1 text-base font-semibold tracking-tight">새 작업 아이템</h2>
      <button
        hlmBtn
        type="button"
        variant="ghost"
        size="icon-sm"
        class="rounded-(--radius-nav)"
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
