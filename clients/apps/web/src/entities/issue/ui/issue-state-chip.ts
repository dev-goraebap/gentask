import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ISSUE_STATES, issueStateLabel, type IssueState } from '../model/issue';

/**
 * 상태는 테두리와 글자가 함께 가른다.
 *
 * <p>더 손댈 것이 없는 둘만 면을 채워 목록에서 뒤로 물러난다. 백로그는 아직 정하지 않은 것이므로
 * 예정보다 흐리게 두어, 같은 미착수라도 어느 쪽이 잡힌 일인지가 눈에 먼저 들어오게 한다.
 */
const STATE_CLASS: Readonly<Record<IssueState, string>> = {
  [ISSUE_STATES.backlog]: 'border-border text-muted-foreground',
  [ISSUE_STATES.unstarted]: 'border-input text-foreground-secondary',
  [ISSUE_STATES.started]: 'border-primary text-primary',
  [ISSUE_STATES.completed]: 'border-transparent bg-muted text-muted-foreground',
  [ISSUE_STATES.canceled]: 'border-transparent bg-muted text-muted-foreground line-through',
};

@Component({
  selector: 'app-issue-state-chip',
  host: { class: 'inline-flex shrink-0' },
  template: `
    <span [class]="chipClass()" class="border px-1.5 py-0.5 text-xs whitespace-nowrap">
      {{ label() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueStateChip {
  // --- 계약 --------------------------------------------------------------------------------------
  readonly state = input.required<IssueState>();

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly chipClass = computed(() => STATE_CLASS[this.state()]);
  protected readonly label = computed(() => issueStateLabel(this.state()));
}
