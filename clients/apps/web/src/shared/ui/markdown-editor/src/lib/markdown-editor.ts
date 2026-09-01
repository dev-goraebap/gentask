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
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import type { Editor } from '@tiptap/core';

/**
 * 마크다운을 적는 자리.
 *
 * <p>보이는 것은 완성된 글이고 담기는 것은 마크다운이다. 원문을 그대로 두는 편집기는 사람이 기호를
 * 직접 치게 하는데, 여기 적는 사람은 대개 에이전트가 아니라 사람이므로 쓰는 동안 이미 읽히는 편이 낫다.
 *
 * <p><b>인수 조건은 번호가 붙은 체크 항목이다.</b> 예전 규약의 `&lt;!-- AC:BEGIN --&gt;` 주석은 이
 * 편집기가 담을 자리를 갖지 않아 저장할 때 사라진다. 그래서 경계를 걷고 번호로 가리게 했다(결정-0007).
 *
 * <p>편집기는 <b>브라우저에서만, 그것도 늦게</b> 싣는다. TipTap 과 ProseMirror 를 첫 묶음에 넣으면
 * 목록과 상세를 여는 사람까지 그 값을 치른다. 서버에서 그리는 동안에는 아무것도 세우지 않으며, 그
 * 자리는 적은 것을 그대로 담은 textarea 가 대신한다 — 스크립트가 죽어도 글은 적힌다.
 */
@Component({
  selector: 'app-markdown-editor',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    @if (ready()) {
      <div
        #host
        class="tiptap-host min-h-40 flex-1 overflow-y-auto text-sm/6 [scrollbar-gutter:stable]"
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
  /*
   * 편집기의 알맹이는 ProseMirror 가 우리 템플릿 밖에서 만든다. 그래서 그 자식들에게는 Angular 가
   * 범위 표시를 달지 못하고, 껍데기를 씌운 스타일이 닿지 않는다. 대신 모든 규칙을 `.tiptap-host`
   * 아래에 두어 밖으로 새지 않게 한다.
   */
  encapsulation: ViewEncapsulation.None,
  styles: `
    .tiptap-host .tiptap-body > * + * {
      margin-top: 0.75rem;
    }

    .tiptap-host h1,
    .tiptap-host h2,
    .tiptap-host h3 {
      font-weight: 600;
      line-height: 1.4;
    }

    .tiptap-host h1 {
      font-size: 1.25rem;
    }
    .tiptap-host h2 {
      font-size: 1.125rem;
    }
    .tiptap-host h3 {
      font-size: 1rem;
    }

    .tiptap-host ul,
    .tiptap-host ol {
      padding-left: 1.25rem;
    }

    .tiptap-host ul {
      list-style: disc;
    }
    .tiptap-host ol {
      list-style: decimal;
    }

    /* 인수 조건이 사는 자리다. 표식을 지우고 칸을 앞에 세운다. */
    .tiptap-host ul[data-type='taskList'] {
      list-style: none;
      padding-left: 0;
    }

    .tiptap-host ul[data-type='taskList'] li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .tiptap-host ul[data-type='taskList'] li > label {
      margin-top: 0.25rem;
      user-select: none;
    }

    .tiptap-host ul[data-type='taskList'] li > div {
      min-width: 0;
      flex: 1;
    }

    .tiptap-host blockquote {
      border-left: 2px solid var(--border);
      padding-left: 0.75rem;
      color: var(--muted-foreground);
    }

    .tiptap-host code {
      font-family: var(--font-mono);
      font-size: 0.875em;
      background: var(--muted);
      border-radius: 0.25rem;
      padding: 0.1em 0.3em;
    }

    .tiptap-host pre {
      font-family: var(--font-mono);
      background: var(--muted);
      border-radius: 0.5rem;
      padding: 0.75rem;
      overflow-x: auto;
    }

    /* 판 안의 코드는 이미 판이 바탕을 갖는다. 두 번 칠하지 않는다. */
    .tiptap-host pre code {
      background: none;
      padding: 0;
    }

    .tiptap-host hr {
      border-top: 1px solid var(--border);
    }

    /* 비어 있을 때만 안내를 보여 준다. 적기 시작하면 사라진다. */
    .tiptap-host p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      color: var(--muted-foreground);
      float: left;
      height: 0;
      pointer-events: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownEditor {
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

    this.editor = createEditor(host, this.value(), this.placeholder(), (markdown) => {
      this.writing = true;
      this.value.set(markdown);
      this.writing = false;
    });
  }
}
