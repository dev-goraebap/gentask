import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ISSUE_KIND_FACES,
  ISSUE_STATE_FACES,
  IssueKindBadge,
  issueKindLabel,
  IssueService,
  IssueStateChip,
  type IssueState,
} from '@/entities/issue';
import { injectProjectRoutes } from '@/entities/project';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { MarkdownView } from '@/shared/ui/markdown-view';
import { AppIcon } from '@/shared/ui/icon';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { AppPageBack } from '@/shared/ui/page-back';

@Component({
  selector: 'app-issue-detail',
  imports: [
    AppPageBack,
    MarkdownView,
    
    RouterLink,
    HlmButton,
    HlmPopoverImports,
    AppIcon,
    EmptyState,
    IssueKindBadge,
    IssueStateChip,
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  templateUrl: './issue-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueDetailPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = injectProjectRoutes();
  protected readonly stateFaces = ISSUE_STATE_FACES;

  // --- 계약 --------------------------------------------------------------------------------------
  readonly id = input.required<string>();

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly issueService = inject(IssueService);

  // --- 파생 --------------------------------------------------------------------------------------
  /** 목록의 줄은 본문과 인수 조건을 갖지 않으므로 상세는 따로 싣는다. */
  protected readonly issue = this.issueService.detailOf(computed(() => this.id()));

  protected readonly kindLabel = computed(() => {
    const issue = this.issue();
    return issue === undefined ? '' : issueKindLabel(issue.kind);
  });

  protected readonly parent = computed(() => {
    const parentId = this.issue()?.parentId;
    return parentId === null || parentId === undefined ? undefined : this.issueService.find(parentId);
  });

  protected readonly kindFaces = ISSUE_KIND_FACES;

  /** 명령줄에서 같은 것을 집는 방법. 트래커의 두 번째 소비자가 에이전트다. */
  protected readonly command = computed(() => `gentask issue show ${this.id()}`);

  // --- 동작 --------------------------------------------------------------------------------------
  protected async setState(state: IssueState): Promise<void> {
    await this.issueService.setState(this.id(), state);
  }
}
