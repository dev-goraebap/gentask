import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AppIcon } from '@/shared/ui/icon';
import {
  ISSUE_KINDS,
  issueKindIcon,
  issueKindLabel,
  type IssueKind,
} from '../model/issue';

/**
 * 작업 아이템 유형의 표식.
 *
 * <p>색만으로 유형을 전하지 않는다. 유형마다 그림이 다르고 스크린리더에는 이름이 간다.
 */
const KIND_CLASS: Readonly<Record<IssueKind, string>> = {
  [ISSUE_KINDS.epic]: 'bg-kind-epic text-kind-epic-foreground',
  [ISSUE_KINDS.story]: 'bg-kind-story text-kind-story-foreground',
  [ISSUE_KINDS.task]: 'bg-kind-task text-kind-task-foreground',
  [ISSUE_KINDS.bug]: 'bg-kind-bug text-kind-bug-foreground',
};

@Component({
  selector: 'app-issue-kind-badge',
  imports: [AppIcon],
  host: { class: 'inline-flex shrink-0' },
  template: `
    <span
      [class]="badgeClass()"
      class="inline-flex size-4.5 items-center justify-center [&_ng-icon]:text-[length:--spacing(3)]"
    >
      <app-icon [name]="icon()" [label]="label()" />
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueKindBadge {
  // --- 계약 --------------------------------------------------------------------------------------
  readonly kind = input.required<IssueKind>();

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly badgeClass = computed(() => KIND_CLASS[this.kind()]);
  protected readonly icon = computed(() => issueKindIcon(this.kind()));
  protected readonly label = computed(() => issueKindLabel(this.kind()));
}
