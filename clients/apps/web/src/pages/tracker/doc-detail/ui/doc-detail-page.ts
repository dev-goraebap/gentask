import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { buildCrumbs, DocService } from '@/entities/doc';
import { injectProjectRoutes } from '@/entities/project';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { HlmFieldError } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { MarkdownEditor } from '@/shared/ui/markdown-editor';
import { MarkdownView } from '@/shared/ui/markdown-view';
import { AppPageBack } from '@/shared/ui/page-back';

@Component({
  selector: 'app-doc-detail',
  imports: [
    AppPageBack,
    RouterLink,
    HlmButton,
    HlmFieldError,
    HlmInput,
    MarkdownEditor,
    MarkdownView,
    AppIcon,
    EmptyState,
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

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly docService = inject(DocService);

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

  // --- 파생 --------------------------------------------------------------------------------------
  /** 목록의 줄은 본문을 갖지 않으므로 상세는 따로 싣는다. */
  private readonly detail = this.docService.detailOf(computed(() => this.id()));

  protected readonly doc = this.detail.value;

  /** 폴더는 아직 목이다(GT-70). 실어 온 문서는 뿌리에 서므로 길은 한 마디다. */
  protected readonly crumbs = computed(() =>
    buildCrumbs(this.docService.folders(), this.doc()?.folderId ?? null),
  );

  protected readonly command = computed(() => `gentask doc cat ${this.id()}`);

  /** 제목이 비면 담지 못한다. 서버도 같은 것을 보지만 여기서 먼저 막아 헛걸음을 줄인다(DOC-003 A1). */
  protected readonly savable = computed(() => this.draftTitle().trim().length > 0);

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
}
