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
import { buildCrumbs, DocService } from '@/entities/doc';
import { injectProjectRoutes } from '@/entities/project';
import { problemDetail } from '@/shared/api';
import { HlmAlertDialog, HlmAlertDialogImports } from '@/shared/ui/alert-dialog';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { HlmFieldError } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { MarkdownEditor } from '@/shared/ui/markdown-editor';
import { MarkdownView } from '@/shared/ui/markdown-view';
import { AppPageBack } from '@/shared/ui/page-back';
import { toast } from '@/shared/ui/sonner';
import { DocDiffView } from './doc-diff-view';
import { DocRevisionList } from './doc-revision-list';

@Component({
  selector: 'app-doc-detail',
  imports: [
    AppPageBack,
    RouterLink,
    HlmAlertDialogImports,
    HlmButton,
    HlmFieldError,
    HlmInput,
    MarkdownEditor,
    MarkdownView,
    AppIcon,
    EmptyState,
    DocDiffView,
    DocRevisionList,
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  templateUrl: './doc-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocDetailPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = injectProjectRoutes();

  // --- 계약 --------------------------------------------------------------------------------------
  readonly id = input.required<string>();

  /**
   * 지나온 것을 보고 있는가.
   *
   * <p>주소가 갖는다. 신호에 두면 새로 고치거나 뒤로 갈 때 사라지고, 어디를 보고 있는지를 건넬 수도
   * 없다. 경로가 아니라 쿼리에 두는 것은 이 화면이 그대로 서 있어야 하기 때문이다.
   */
  readonly revisions = input(false, { transform: toFlag });
  readonly rev = input<number | undefined, string | undefined>(undefined, {
    transform: toRevisionNo,
  });
  readonly against = input<number | undefined, string | undefined>(undefined, {
    transform: toRevisionNo,
  });
  readonly revPage = input<number, string | undefined>(0, { transform: toPage });

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly docService = inject(DocService);
  private readonly router = inject(Router);

  // --- 질의 --------------------------------------------------------------------------------------
  private readonly confirm = viewChild(HlmAlertDialog);

  // --- 상태 --------------------------------------------------------------------------------------
  /**
   * 고치는 중인가.
   *
   * <p>적던 것은 이 자리에만 있고 그만두면 사라진다. 되살릴 자리를 두려면 어디에 얼마나 남길지가
   * 먼저 정해져야 한다(DOC-003 A4).
   */
  protected readonly editing = signal(false);

  protected readonly draftTitle = signal('');
  protected readonly draftBody = signal('');
  /** 개정 사유는 적지 않아도 된다(DOC-003). 필수로 걸면 "수정" 같은 말만 쌓인다. */
  protected readonly draftComment = signal('');

  /** 되돌린 이유. 적지 않으면 서버가 몇 번째로 되돌렸는지를 스스로 적는다(DOC-005 A3). */
  protected readonly revertComment = signal('');

  protected readonly reverting = signal(false);

  // --- 파생 --------------------------------------------------------------------------------------
  /** 목록의 줄은 본문을 갖지 않으므로 상세는 따로 싣는다. */
  private readonly detail = this.docService.detailOf(computed(() => this.id()));

  protected readonly doc = this.detail.value;

  /** 이력을 열지 않았으면 아무것도 묻지 않는다. 여는 사람이 훨씬 적은 자리다. */
  private readonly historyId = computed(() => (this.revisions() ? this.id() : undefined));

  protected readonly history = this.docService.revisionsOf(
    this.historyId,
    computed(() => this.revPage()),
  );

  protected readonly chosenNo = computed(() => (this.revisions() ? this.rev() : undefined));

  /** 견줄 상대. 고른 것이 없거나 자기 자신이면 견줄 것이 없다(DOC-004 A1). */
  protected readonly againstNo = computed(() => {
    const chosen = this.chosenNo();
    const against = this.against();
    return chosen === undefined || against === undefined || against === chosen
      ? undefined
      : against;
  });

  protected readonly chosen = this.docService.revisionOf(this.historyId, this.chosenNo);

  private readonly other = this.docService.revisionOf(this.historyId, this.againstNo);

  protected readonly historyLink = computed(() => this.routes().doc(this.id()));

  protected readonly historyFailed = computed(() => this.history.status() === 'error');

  protected readonly chosenFailed = computed(() => this.chosen.status() === 'error');

  /**
   * 견주는 두 개정.
   *
   * <p>지난 것을 앞에 둔다. 고른 차례가 아니라 시간이 순서를 정해야 무엇이 무엇으로 바뀌었는지가
   * 뒤집히지 않는다.
   */
  protected readonly comparison = computed(() => {
    const chosen = this.chosen.value();
    const other = this.other.value();
    if (this.againstNo() === undefined || chosen === undefined || other === undefined) {
      return undefined;
    }

    const chosenIsOlder = chosen.summary.revisionNo < other.summary.revisionNo;
    return {
      from: chosenIsOlder ? chosen : other,
      to: chosenIsOlder ? other : chosen,
    };
  });

  /** 문서가 담긴 자리에서 위로 올라가는 길. 뿌리에 서 있으면 한 마디다. */
  protected readonly crumbs = computed(() =>
    buildCrumbs(this.docService.folders(), this.doc()?.folderId ?? null),
  );

  protected readonly command = computed(() => `gentask doc cat ${this.id()}`);

  /** 제목이 비면 담지 못한다. 서버도 같은 것을 보지만 여기서 먼저 막아 헛걸음을 줄인다(DOC-003 A1). */
  protected readonly savable = computed(() => this.draftTitle().trim().length > 0);

  /** 지금 참인 개정으로 되돌리는 것은 아무것도 담지 않고 성공한다(DOC-005 A2). 실패가 아니다. */
  protected readonly revertingToCurrent = computed(
    () => this.chosenNo() !== undefined && this.chosenNo() === this.doc()?.revisionNo,
  );

  // --- 동작 --------------------------------------------------------------------------------------
  protected startEdit(): void {
    const doc = this.doc();
    if (doc === undefined) return;

    this.draftTitle.set(doc.title);
    this.draftBody.set(doc.body);
    this.draftComment.set('');
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
  }

  protected onTitleInput(event: Event): void {
    this.draftTitle.set((event.target as HTMLInputElement).value);
  }

  protected onCommentInput(event: Event): void {
    this.draftComment.set((event.target as HTMLInputElement).value);
  }

  protected onRevertCommentInput(event: Event): void {
    this.revertComment.set((event.target as HTMLInputElement).value);
  }

  /**
   * 담는다.
   *
   * <p>앞의 개정과 같으면 개정을 만들지 않는다(DOC-003 A2). 그 판정은 서버가 가지므로 여기서는
   * 담을 것이 없었다고 알리지 않고 읽는 자리로 되돌린다.
   */
  protected async save(): Promise<void> {
    const title = this.draftTitle().trim();
    if (title === '') return;

    const comment = this.draftComment().trim();
    await this.docService.edit(this.id(), title, this.draftBody(), comment === '' ? null : comment);
    // 목록과 다른 리소스라 이 자리를 따로 다시 싣지 않으면 고친 것이 화면에 남지 않는다.
    this.detail.reload();
    this.editing.set(false);
  }

  /**
   * 고른 개정으로 되돌린다.
   *
   * <p>되묻는 자리를 지나야만 닿는다(DOC-005 기본 흐름 3). 그만두면 이 자리에 오지 않으므로 아무것도
   * 담지 않는다(DOC-005 A1).
   *
   * <p>담고 나면 읽는 자리로 되돌아간다. 상세와 이력이 다른 리소스라 둘 다 다시 싣지 않으면 방금
   * 담은 개정이 화면에 서지 않는다.
   */
  protected async revert(): Promise<void> {
    const revisionNo = this.chosenNo();
    if (revisionNo === undefined || this.reverting()) return;

    const comment = this.revertComment().trim();
    this.reverting.set(true);
    try {
      await this.docService.revert(this.id(), revisionNo, comment === '' ? null : comment);
    } catch (error) {
      // 남의 것에 닿으면 서버가 404 를 낸다. 있으나 권한이 없다고 알리지 않는다(DOC-005 A5).
      toast.error(problemDetail(error, '그 개정을 찾지 못했습니다.'));
      return;
    } finally {
      this.reverting.set(false);
      this.confirm()?.close();
    }

    this.revertComment.set('');
    this.detail.reload();
    this.history.reload();
    await this.router.navigateByUrl(this.historyLink());
  }
}

/** 열려 있음은 값이 있다는 것으로 말한다. 무엇으로 열었는지는 주소가 담을 것이 아니다. */
function toFlag(raw: string | undefined): boolean {
  return raw !== undefined && raw !== '' && raw !== '0';
}

/** 개정 번호는 1부터 매긴다. 주소에 아무 글자나 실려 와도 고르지 않은 것으로 본다. */
function toRevisionNo(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function toPage(raw: string | undefined): number {
  if (raw === undefined) return 0;

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}
