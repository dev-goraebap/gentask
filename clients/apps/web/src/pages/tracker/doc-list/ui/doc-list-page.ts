import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { buildCrumbs, DocService, docsIn, foldersIn, type DocFolder } from '@/entities/doc';
import { injectProjectRoutes } from '@/entities/project';
import { problemDetail } from '@/shared/api';
import { HlmAlertDialog, HlmAlertDialogImports } from '@/shared/ui/alert-dialog';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { toast } from '@/shared/ui/sonner';
import { moveTargets } from '../lib/move-targets';
import { DocMoveDialog } from './doc-move-dialog';

/** 무엇을 세우는 중인가. 둘이 같은 적는 자리를 쓰고 이름표만 갈린다. */
type Creating = 'doc' | 'folder';

/** 접근 권한이 없거나 삭제된 문서인 경우 404 응답을 반환한다. */
const GONE = '그 자리가 없습니다.';

@Component({
  selector: 'app-doc-list',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    HlmAlertDialogImports,
    HlmButton,
    HlmInput,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    AppIcon,
    EmptyState,
    DocMoveDialog,
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

  /** 이름을 바꾸는 중인 폴더. 한 번에 하나만 연다. */
  protected readonly renaming = signal<string | null>(null);
  protected readonly renameDraft = signal('');

  /**
   * 이름을 적으라고 이미 말했는가.
   *
   * 여는 순간부터 비어 있다고 말하면 적기도 전에 틀린 것이 된다. 담으려 했거나 자리를 벗어난
   * 뒤에 말한다(DOC-008 A1).
   */
  protected readonly nameAsked = signal(false);

  /** 지우는 중인가. 되묻는 자리의 단추를 두 번 누르는 것을 막는다. */
  protected readonly removing = signal(false);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly folderId = computed<string | null>(() => this.folder() ?? null);

  protected readonly crumbs = computed(() =>
    buildCrumbs(this.docService.folders(), this.folderId()),
  );

  protected readonly title = computed(() => {
    const trail = this.crumbs();
    return trail[trail.length - 1].name;
  });

  /**
   * 이 자리의 폴더와 그 각각이 갈 수 있는 자리.
   *
   * 이동 가능한 대상 폴더 목록을 계산하여 캐싱한다.
   */
  protected readonly folderRows = computed(() => {
    const folders = this.docService.folders();
    const here = this.folderId();
    return foldersIn(folders, here).map((folder) => ({
      folder,
      targets: moveTargets(folders, here, folder.id),
    }));
  });

  protected readonly childDocs = computed(() => docsIn(this.docService.list(), this.folderId()));

  /** 동일 폴더 소속 문서들의 이동 가능 폴더 목록을 계산한다. */
  protected readonly docTargets = computed(() =>
    moveTargets(this.docService.folders(), this.folderId(), null),
  );

  protected readonly creatingLabel = computed(() =>
    this.creating() === 'folder' ? '폴더 이름' : '문서 제목',
  );

  protected readonly creatable = computed(() => this.draft().name.trim().length > 0);

  protected readonly renamable = computed(() => this.renameDraft().trim().length > 0);

  /** 로딩 실패 시 빈 화면 대신 오류 상태를 표시한다. */
  protected readonly failed = computed(
    () => this.docService.status() === 'error' || this.docService.folderStatus() === 'error',
  );

  /** 다 싣기 전에는 비어 있다고 말하지 않는다. */
  protected readonly settled = computed(
    () => this.docService.status() === 'resolved' && this.docService.folderStatus() === 'resolved',
  );

  protected readonly empty = computed(
    () => this.settled() && this.folderRows().length === 0 && this.childDocs().length === 0,
  );

  // --- 동작 --------------------------------------------------------------------------------------
  protected reload(): void {
    this.docService.reload();
  }

  protected startCreating(what: Creating): void {
    this.creating.set(what);
    this.draft.set({ name: '' });
    this.nameAsked.set(false);
  }

  protected cancelCreating(): void {
    this.creating.set(null);
    this.draft.set({ name: '' });
    this.nameAsked.set(false);
  }

  /**
   * 신규 문서를 생성한다.
   *
   * 하위 폴더 및 문서는 현재 열려 있는 폴더 하위에 생성된다(DOC-008 기본 흐름 6).
   * 이름이 겹쳐도 막지 않는다 — 가리키는 것이 이름이 아니라 식별자다(DOC-008 A2).
   */
  protected async create(): Promise<void> {
    const name = this.draft().name.trim();
    if (name === '') {
      this.nameAsked.set(true);
      return;
    }

    if (this.creating() === 'folder') {
      try {
        await this.docService.addFolder(name, this.folderId());
      } catch (error) {
        toast.error(problemDetail(error, GONE));
        return;
      }
      this.cancelCreating();
      return;
    }

    // 본문은 빈 문자열로 초기 문서를 생성한다(DOC-001).
    const id = await this.docService.add(name, '', this.folderId());
    this.cancelCreating();
    if (id === undefined) return;

    await this.router.navigate([this.routes().doc(id)]);
  }

  protected createOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    void this.create();
  }

  protected startRenaming(folder: DocFolder): void {
    this.renaming.set(folder.id);
    this.renameDraft.set(folder.name);
    this.nameAsked.set(false);
  }

  protected cancelRenaming(): void {
    this.renaming.set(null);
    this.renameDraft.set('');
    this.nameAsked.set(false);
  }

  protected onRenameInput(event: Event): void {
    this.renameDraft.set((event.target as HTMLInputElement).value);
  }

  /** 이름을 바꿔도 그 폴더를 가리키던 길은 끊기지 않는다(DOC-008 A4). */
  protected async rename(): Promise<void> {
    const id = this.renaming();
    const name = this.renameDraft().trim();
    if (id === null) return;
    if (name === '') {
      this.nameAsked.set(true);
      return;
    }

    try {
      await this.docService.renameFolder(id, name);
    } catch (error) {
      toast.error(problemDetail(error, GONE));
      return;
    }
    this.cancelRenaming();
  }

  protected renameOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    void this.rename();
  }

  /** 담긴 문서와 하위 폴더가 함께 간다(DOC-008 A5). 고를 수 없게 막아 두었어도 서버가 다시 본다. */
  protected async moveFolder(id: string, parentId: string | null): Promise<void> {
    try {
      await this.docService.moveFolder(id, parentId);
    } catch (error) {
      // 자기 자신이나 하위 자손 폴더로는 이동할 수 없다(DOC-008 A6).
      toast.error(problemDetail(error, GONE));
    }
  }

  /** 대상 폴더 미지정 시 루트 폴더로 이동한다(DOC-006 A1). */
  protected async moveDoc(id: string, folderId: string | null): Promise<void> {
    try {
      await this.docService.moveDoc(id, folderId);
    } catch (error) {
      toast.error(problemDetail(error, GONE));
    }
  }

  /**
   * 폴더를 지운다(DOC-008 A7).
   *
   * 되묻는 자리를 지나야만 닿는다. 담긴 문서와 하위 폴더는 함께 지워지지 않고 한 단계 위로
   * 올라온다.
   */
  protected async remove(folder: DocFolder, dialog: HlmAlertDialog): Promise<void> {
    if (this.removing()) return;

    this.removing.set(true);
    try {
      await this.docService.removeFolder(folder.id);
    } catch (error) {
      toast.error(problemDetail(error, GONE));
    } finally {
      this.removing.set(false);
      dialog.close();
    }
  }
}
