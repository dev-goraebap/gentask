import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { buildCrumbs, DocService, docsIn, foldersIn } from '@/entities/doc';
import { injectProjectRoutes } from '@/entities/project';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { HlmField, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';

/** 무엇을 세우는 중인가. 둘이 같은 적는 자리를 쓰고 이름표만 갈린다. */
type Creating = 'doc' | 'folder';

@Component({
  selector: 'app-doc-list',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    HlmButton,
    HlmInput,
    HlmField,
    HlmFieldLabel,
    AppIcon,
    EmptyState,
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  templateUrl: './doc-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocListPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = injectProjectRoutes();

  // --- 계약 --------------------------------------------------------------------------------------
  readonly folder = input<string | undefined>(undefined);

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly docService = inject(DocService);
  private readonly router = inject(Router);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly creating = signal<Creating | null>(null);
  private readonly draft = signal({ name: '' });
  protected readonly createForm = form(this.draft);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly folderId = computed<string | null>(() => this.folder() ?? null);

  /** 폴더는 아직 목이다(GT-70). 실어 온 문서는 모두 뿌리에 서므로 길은 대개 한 마디다. */
  protected readonly crumbs = computed(() =>
    buildCrumbs(this.docService.folders(), this.folderId()),
  );

  protected readonly title = computed(() => {
    const trail = this.crumbs();
    return trail[trail.length - 1].name;
  });

  /** 목. 서버에 폴더가 서기 전까지는 이 자리에서 세운 것만 보인다(GT-70). */
  protected readonly childFolders = computed(() =>
    foldersIn(this.docService.folders(), this.folderId()),
  );

  protected readonly childDocs = computed(() => docsIn(this.docService.list(), this.folderId()));

  protected readonly creatingLabel = computed(() =>
    this.creating() === 'folder' ? '폴더 이름' : '문서 제목',
  );

  protected readonly creatable = computed(() => this.draft().name.trim().length > 0);

  // --- 동작 --------------------------------------------------------------------------------------
  protected startCreating(what: Creating): void {
    this.creating.set(what);
    this.draft.set({ name: '' });
  }

  protected cancelCreating(): void {
    this.creating.set(null);
    this.draft.set({ name: '' });
  }

  protected async create(): Promise<void> {
    const name = this.draft().name.trim();
    if (name === '') return;

    if (this.creating() === 'folder') {
      this.docService.addFolder(name, this.folderId());
      this.cancelCreating();
      return;
    }

    // 본문은 비워 둔 채 세운다. 제목만 정해 두고 나중에 채우는 것이 흔한 이유다(DOC-001).
    const id = await this.docService.add(name);
    this.cancelCreating();
    if (id === undefined) return;

    await this.router.navigate([this.routes().doc(id)]);
  }

  protected createOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    void this.create();
  }
}
