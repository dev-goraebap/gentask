import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ISSUE_KIND_FACES,
  ISSUE_STATE_FACES,
  IssueKindBadge,
  issueKindLabel,
  IssueService,
  issueStateLabel,
  IssueStateChip,
  type IssueKind,
  type IssueState,
} from '@/entities/issue';
import { injectProjectRoutes } from '@/entities/project';
import { HlmAlertDialog, HlmAlertDialogImports } from '@/shared/ui/alert-dialog';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { HlmFieldError } from '@/shared/ui/field';
import { HlmInput } from '@/shared/ui/input';
import { MarkdownEditor } from '@/shared/ui/markdown-editor';
import { MarkdownView } from '@/shared/ui/markdown-view';
import { AppIcon } from '@/shared/ui/icon';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { AppPageBack } from '@/shared/ui/page-back';

@Component({
  selector: 'app-issue-detail',
  imports: [
    AppPageBack,
    HlmAlertDialogImports,
    MarkdownEditor,
    MarkdownView,
    HlmInput,
    RouterLink,
    HlmButton,
    HlmPopoverImports,
    AppIcon,
    EmptyState,
    HlmFieldError,
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
  private readonly router = inject(Router);

  // --- 질의 --------------------------------------------------------------------------------------
  private readonly confirm = viewChild(HlmAlertDialog);

  // --- 파생 --------------------------------------------------------------------------------------
  /** 목록의 줄은 본문과 인수 조건을 갖지 않으므로 상세는 따로 싣는다. */
  private readonly detail = this.issueService.detailOf(computed(() => this.id()));

  protected readonly issue = this.detail.value;

  protected readonly kindLabel = computed(() => {
    const issue = this.issue();
    return issue === undefined ? '' : issueKindLabel(issue.kind);
  });

  /** 상태는 칩이 글자로 그리지만, 그것을 여는 단추에는 스크린리더가 읽을 이름이 따로 있어야 한다. */
  protected readonly stateLabel = computed(() => {
    const issue = this.issue();
    return issue === undefined ? '' : issueStateLabel(issue.state);
  });

  protected readonly parent = computed(() => {
    const parentId = this.issue()?.parentId;
    return parentId === null || parentId === undefined ? undefined : this.issueService.find(parentId);
  });

  protected readonly kindFaces = ISSUE_KIND_FACES;

  // --- 고치기 ------------------------------------------------------------------------------------
  /**
   * 고치는 중인가.
   *
   * <p>적던 것은 이 자리에만 있고 그만두면 사라진다. 되살릴 자리를 두려면 어디에 얼마나 남길지가
   * 먼저 정해져야 한다(ITM-004 A2).
   */
  protected readonly editing = signal(false);

  protected readonly draftTitle = signal('');
  protected readonly draftBody = signal('');
  protected readonly draftKind = signal<IssueKind>(ISSUE_KIND_FACES[0].value);

  protected readonly draftKindLabel = computed(() => issueKindLabel(this.draftKind()));

  /** 제목이 비면 담지 못한다. 서버도 같은 것을 보지만 여기서 먼저 막아 헛걸음을 줄인다. */
  protected readonly savable = computed(() => this.draftTitle().trim().length > 0);

  protected startEdit(): void {
    const issue = this.issue();
    if (issue === undefined) return;

    this.draftTitle.set(issue.title);
    this.draftBody.set(issue.body);
    this.draftKind.set(issue.kind);
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
  }

  protected pickKind(value: IssueKind): void {
    this.draftKind.set(value);
  }

  protected onTitleInput(event: Event): void {
    this.draftTitle.set((event.target as HTMLInputElement).value);
  }

  protected async save(): Promise<void> {
    const title = this.draftTitle().trim();
    if (title === '') return;

    await this.issueService.edit(this.id(), title, this.draftKind(), this.draftBody());
    // 목록과 다른 리소스라 이 자리를 따로 다시 싣지 않으면 고친 것이 화면에 남지 않는다.
    this.detail.reload();
    this.editing.set(false);
  }

  /** 명령줄에서 같은 것을 집는 방법. 트래커의 두 번째 소비자가 에이전트다. */
  protected readonly command = computed(() => `gentask issue show ${this.id()}`);

  // --- 동작 --------------------------------------------------------------------------------------
  /**
   * 지운다.
   *
   * <p>되묻는 자리를 지난 뒤에만 여기에 닿는다. 지운 자리에 그대로 서 있으면 없는 것을 열고 있는
   * 꼴이므로 목록으로 되돌린다(ITM-005).
   */
  protected async remove(): Promise<void> {
    this.confirm()?.close();
    await this.issueService.remove(this.id());
    await this.router.navigateByUrl(this.routes().issues());
  }

  protected async setState(state: IssueState): Promise<void> {
    await this.issueService.setState(this.id(), state);
    this.detail.reload();
  }
}
