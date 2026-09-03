import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import {
  ISSUE_KIND_FACES,
  ISSUE_KINDS,
  IssueKindBadge,
  issueKindLabel,
  IssueService,
  type IssueKind,
} from '@/entities/issue';
import { HlmButton } from '@/shared/ui/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { MarkdownEditor } from '@/shared/ui/markdown-editor';

/**
 * 작업 아이템을 세우는 자리.
 *
 * 이 컴포넌트는 자기가 덮개 안에 있는지 화면 하나를 차지하고 있는지 모른다. 그 판정은 라우트가
 * 하며 여기는 받은 것을 적어 세우기만 한다. 두 자리가 이것을 함께 쓰므로 폼이 한 벌로 유지된다.
 *
 * 본문은 마크다운 자유 서술이다. 인수 조건도 그 안의 관례로 적는다 — 칸으로 강제하면 제목 하나만
 * 적어 두려는 사람이 매번 그 자리를 지나야 한다.
 */
@Component({
  selector: 'app-issue-create-form',
  imports: [
    FormRoot,
    FormField,
    HlmButton,
    HlmInput,
    MarkdownEditor,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    HlmPopoverImports,
    AppIcon,
    IssueKindBadge,
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  templateUrl: './issue-create-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueCreateForm {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly kindFaces = ISSUE_KIND_FACES;

  // --- 계약 --------------------------------------------------------------------------------------
  /** 생성된 작업 항목 식별자 이벤트 이미터다. */
  readonly created = output<string>();

  readonly dismissed = output<void>();

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly issueService = inject(IssueService);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly kind = signal<IssueKind>(ISSUE_KINDS.task);
  private readonly draft = signal({ title: '', body: '' });
  protected readonly issueForm = form(this.draft, (path) => {
    validate(path.title, ({ value }) =>
      value().trim() === '' ? requiredError({ message: '제목을 입력해 주세요.' }) : undefined,
    );
  });

  /**
   * 본문. 편집기가 마크다운을 되돌려 주므로 폼의 칸이 아니라 이 자리가 받는다.
   *
   * 폼의 `body` 는 적는 자리를 갖지 않게 되었고, 세울 때 이 값을 함께 보낸다.
   */
  protected readonly body = signal('');

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly kindLabel = computed(() => issueKindLabel(this.kind()));
  protected readonly creatable = computed(() => this.draft().title.trim().length > 0);

  // --- 동작 --------------------------------------------------------------------------------------
  protected pickKind(value: IssueKind): void {
    this.kind.set(value);
  }

  protected async create(): Promise<void> {
    const title = this.draft().title.trim();
    if (title === '') return;

    const created = await this.issueService.add(title, this.kind(), this.body().trim());
    if (created !== undefined) this.created.emit(created);
  }

  protected dismiss(): void {
    this.dismissed.emit();
  }

  /**
   * 제목 입력란에서 Enter 입력 시 작업 항목을 생성한다.
   *
   * 본문에서는 줄을 바꾸는 것이 맞으므로 여기에만 건다. 한글을 조합하는 중의 엔터는 글자를 확정하는
   * 것이지 제출이 아니다.
   */
  protected createOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    this.create();
  }
}
