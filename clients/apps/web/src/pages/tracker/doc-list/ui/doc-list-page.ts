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
import { AppPageBack } from '@/shared/ui/page-back';

/** 무엇을 세우는 중인가. 둘이 같은 적는 자리를 쓰고 이름표만 갈린다. */
type Creating = 'doc' | 'folder';

@Component({
  selector: 'app-doc-list',
  imports: [AppPageBack, 
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

  protected readonly crumbs = computed(() =>
    buildCrumbs(this.docService.folders(), this.folderId()),
  );

  protected readonly title = computed(() => {
    const trail = this.crumbs();
    return trail[trail.length - 1].name;
  });

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

  protected create(): void {
    const name = this.draft().name.trim();
    if (name === '') return;

    if (this.creating() === 'folder') {
      this.docService.addFolder(name, this.folderId());
      this.cancelCreating();
      return;
    }

    const id = this.docService.addDoc(name, this.folderId());
    this.cancelCreating();
    void this.router.navigate([this.routes().doc(id)]);
  }

  protected createOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    this.create();
  }
}
