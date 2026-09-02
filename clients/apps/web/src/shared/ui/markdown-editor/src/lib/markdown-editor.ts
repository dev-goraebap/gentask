import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import type { Editor } from '@tiptap/core';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon, type IconName } from '@/shared/ui/icon';

/** 도구 하나. 무엇을 켜고 끄는지와 어떤 그림으로 보이는지를 함께 갖는다. */
interface Tool {
  readonly key: string;
  readonly icon: IconName;
  readonly label: string;
  /** 앞에 칸을 띄운다. 성격이 다른 묶음을 눈으로 가른다. */
  readonly group?: boolean;
}

const TOOLS: readonly Tool[] = [
  { key: 'undo', icon: 'hgiUndo', label: '되돌리기' },
  { key: 'redo', icon: 'hgiRedo', label: '다시 하기' },
  { key: 'bold', icon: 'hgiBold', label: '굵게', group: true },
  { key: 'italic', icon: 'hgiItalic', label: '기울임' },
  { key: 'strike', icon: 'hgiStrikethrough', label: '취소선' },
  { key: 'code', icon: 'hgiTerminal', label: '인라인 코드' },
  { key: 'h2', icon: 'hgiHeading2', label: '제목', group: true },
  { key: 'h3', icon: 'hgiHeading3', label: '작은 제목' },
  { key: 'bullet', icon: 'hgiListBullet', label: '목록', group: true },
  { key: 'ordered', icon: 'hgiListNumber', label: '번호 목록' },
  { key: 'task', icon: 'hgiTask', label: '체크 항목' },
  { key: 'quote', icon: 'hgiQuote', label: '인용', group: true },
  { key: 'codeBlock', icon: 'hgiCodeBlock', label: '코드 판' },
];

/** 켜져 있는지 보는 이름. 되돌리기처럼 켜짐이 없는 것은 여기 없다. */
const ACTIVE: Record<string, [string, Record<string, unknown>?]> = {
  bold: ['bold'],
  italic: ['italic'],
  strike: ['strike'],
  code: ['code'],
  h2: ['heading', { level: 2 }],
  h3: ['heading', { level: 3 }],
  bullet: ['bulletList'],
  ordered: ['orderedList'],
  task: ['taskList'],
  quote: ['blockquote'],
  codeBlock: ['codeBlock'],
};

/**
 * 마크다운을 적는 자리.
 *
 * <p>보이는 것은 완성된 글이고 담기는 것은 마크다운이다. 읽는 자리와 같은 서식(`doc-body prose`)을
 * 입으므로 적으면서 결과를 가늠할 수 있다.
 *
 * <p><b>인수 조건은 번호가 붙은 체크 항목이다.</b> 예전 규약의 HTML 주석은 이 편집기가 담을 자리를
 * 갖지 않아 저장할 때 사라진다. 그래서 경계를 걷고 번호로 가리게 했다(결정-0007).
 *
 * <p>편집기는 <b>브라우저에서만, 그것도 늦게</b> 싣는다. TipTap 과 ProseMirror 를 첫 묶음에 넣으면
 * 목록과 상세를 여는 사람까지 그 값을 치른다. 서버에서 그리는 동안에는 아무것도 세우지 않으며, 그
 * 자리는 적은 것을 그대로 담은 textarea 가 대신한다 — 스크립트가 죽어도 글은 적힌다.
 */
@Component({
  selector: 'app-markdown-editor',
  imports: [HlmButton, AppIcon],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    @if (ready()) {
      <div
        role="toolbar"
        aria-label="서식"
        aria-controls="markdown-editor-body"
        class="border-border flex flex-wrap items-center gap-0.5 border-b pb-2"
      >
        @for (tool of tools; track tool.key) {
          @if (tool.group) {
            <span class="bg-border mx-1 h-4 w-px" aria-hidden="true"></span>
          }
          <button
            hlmBtn
            type="button"
            variant="ghost"
            size="icon"
            class="size-7 max-md:min-h-9 max-md:min-w-9"
            [attr.aria-label]="tool.label"
            [attr.aria-pressed]="pressed(tool.key)"
            [title]="tool.label"
            (mousedown)="$event.preventDefault()"
            (click)="run(tool.key)"
          >
            <app-icon [name]="tool.icon" />
          </button>
        }
      </div>

      <div
        #host
        id="markdown-editor-body"
        class="min-h-40 flex-1 overflow-y-auto pt-3 [scrollbar-gutter:stable]"
      ></div>
    } @else {
      <textarea
        [id]="inputId()"
        [attr.placeholder]="placeholder()"
        [value]="value()"
        (input)="onFallbackInput($event)"
        class="placeholder:text-muted-foreground min-h-40 flex-1 resize-none bg-transparent text-sm/6 outline-none"
      ></textarea>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownEditor {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly tools = TOOLS;

  // --- 계약 --------------------------------------------------------------------------------------
  readonly value = model<string>('');
  readonly placeholder = input('');
  readonly inputId = input<string | undefined>(undefined);

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly host = viewChild<ElementRef<HTMLElement>>('host');
  protected readonly ready = signal(false);

  /** 편집기 안이 바뀔 때마다 오른다. 단추의 눌린 모습이 이것을 따라간다. */
  private readonly revision = signal(0);

  private editor: Editor | null = null;

  /** 늦게 실은 모듈이 준 읽개. 편집기와 함께 들고 있어야 효과가 값을 견줄 수 있다. */
  private read: ((editor: Editor) => string) | null = null;

  /** 편집기가 낸 값을 되받아 다시 넣지 않기 위한 표시. 커서가 튀는 것을 막는다. */
  private writing = false;

  // --- 생성 --------------------------------------------------------------------------------------
  constructor() {
    if (!this.isServer) void this.load();

    // 자리가 생기면 세운다. 늦게 실은 뒤에야 자리가 생기므로 효과로 기다린다.
    effect(() => {
      const host = this.host()?.nativeElement;
      if (host === undefined || this.editor !== null) return;
      void this.mount(host);
    });

    // 바깥이 값을 갈아 끼우면 따라간다. 우리가 낸 값이면 그대로 둔다.
    effect(() => {
      const next = this.value();
      if (this.editor === null || this.read === null || this.writing) return;
      if (this.read(this.editor) === next) return;
      this.editor.commands.setContent(next);
    });

    this.destroyRef.onDestroy(() => this.editor?.destroy());
  }

  // --- 동작 --------------------------------------------------------------------------------------
  /** 켜져 있는가. 단추의 눌린 모습이며, 켜짐이 없는 것은 undefined 를 낸다. */
  protected pressed(key: string): boolean | undefined {
    this.revision();

    const active = ACTIVE[key];
    if (active === undefined || this.editor === null) return undefined;

    const [name, attrs] = active;
    return this.editor.isActive(name, attrs);
  }

  /**
   * 도구를 누른다.
   *
   * <p>누르기 전에 mousedown 을 막는다. 막지 않으면 편집기가 초점을 잃어 커서 자리가 사라지고,
   * 명령이 어디에 걸리는지가 흔들린다.
   */
  protected run(key: string): void {
    const editor = this.editor;
    if (editor === null) return;

    const chain = editor.chain().focus();
    switch (key) {
      case 'undo':
        chain.undo().run();
        return;
      case 'redo':
        chain.redo().run();
        return;
      case 'bold':
        chain.toggleBold().run();
        return;
      case 'italic':
        chain.toggleItalic().run();
        return;
      case 'strike':
        chain.toggleStrike().run();
        return;
      case 'code':
        chain.toggleCode().run();
        return;
      case 'h2':
        chain.toggleHeading({ level: 2 }).run();
        return;
      case 'h3':
        chain.toggleHeading({ level: 3 }).run();
        return;
      case 'bullet':
        chain.toggleBulletList().run();
        return;
      case 'ordered':
        chain.toggleOrderedList().run();
        return;
      case 'task':
        chain.toggleTaskList().run();
        return;
      case 'quote':
        chain.toggleBlockquote().run();
        return;
      case 'codeBlock':
        chain.toggleCodeBlock().run();
        return;
      default:
        return;
    }
  }

  protected onFallbackInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }

  // --- 내부 --------------------------------------------------------------------------------------
  /** 묶음을 늦게 싣는다. 이 자리를 지나야 첫 묶음에서 빠진다. */
  private async load(): Promise<void> {
    await import('./tiptap');
    this.ready.set(true);
  }

  private async mount(host: HTMLElement): Promise<void> {
    const { createEditor, readMarkdown } = await import('./tiptap');
    this.read = readMarkdown;

    this.editor = createEditor(
      host,
      this.value(),
      this.placeholder(),
      (markdown) => {
        this.writing = true;
        this.value.set(markdown);
        this.writing = false;
      },
      () => this.revision.update((each) => each + 1),
    );
  }
}
