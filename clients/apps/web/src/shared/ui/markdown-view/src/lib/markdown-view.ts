import { isPlatformServer } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';

/**
 * 마크다운을 읽는 자리.
 *
 * <p>트래커의 두 번째 소비자가 에이전트다. 사람이 손으로 적는 것보다 명령줄로 들어오는 글이 많으므로,
 * 잘 <b>보이는</b> 것이 잘 적히는 것만큼 중요하다.
 *
 * <p>서식의 본체는 `@fumadocs/tailwind` 의 typography 프리셋이며(`prose`), 이 컴포넌트는 셋만 맡는다 —
 * 프리셋 색을 우리 토큰에 잇는 일, 프리셋이 다루지 않는 코드 판을 그리는 일, 강조 블록을 그리는 일.
 *
 * <p>`[innerHTML]` 로 넣은 것에는 컴포넌트 스타일의 껍데기가 붙지 않으므로 캡슐화를 끄고 모든 규칙을
 * `.doc-body` 아래에 둔다.
 */
@Component({
  selector: 'app-markdown-view',
  template: `<div #body class="doc-body prose max-w-none" [innerHTML]="html()"></div>`,
  encapsulation: ViewEncapsulation.None,
  styles: `
    .doc-body {
      /*
       * 프리셋이 참조하는 색 여섯을 우리 토큰에 잇는다. :root 가 아니라 이 선택자 안에 두는 것은
       * 본문 밖에서 fd 토큰이 서지 않게 하여 다른 코드가 그 계보를 실수로 참조하지 않게 하기 위해서다.
       */
      --color-fd-foreground: var(--foreground);
      --color-fd-muted-foreground: var(--muted-foreground);
      --color-fd-border: var(--border);
      --color-fd-muted: var(--muted);
      --color-fd-card: var(--card);
      --color-fd-primary: var(--primary);
    }

    /* 넓은 표는 제 자리 안에서 가로로 흐른다. 본문이 가로로 밀리면 읽는 자리가 흔들린다. */
    .doc-body table {
      display: block;
      overflow-x: auto;
    }

    /*
     * 코드 판. 프리셋은 인라인 code 만 다루고 pre 는 다루지 않으므로 여기서 그린다.
     * 모서리는 우리 것을 쓴다 — 이 저장소는 각진 것을 골라 두었다(--radius: 0).
     */
    .doc-body pre {
      overflow-x: auto;
      margin-block: 1.5rem;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--muted);
      font-size: 0.8125rem;
      line-height: 1.65;
    }

    /*
     * Shiki 가 두 테마의 색을 각각 --shiki-light 와 --shiki-dark 로 심는다. light-dark() 로 고르면
     * color-scheme 이 판단하므로 토큰과 같은 방식으로 갈린다. 바탕은 테마가 제안한 것 대신 우리 것을 쓴다.
     */
    .doc-body .shiki,
    .doc-body .shiki span {
      color: light-dark(var(--shiki-light), var(--shiki-dark));
      background: transparent;
    }

    /*
     * 강조 블록. 인용문 첫 줄에 [!NOTE] 처럼 적으면 marked-alert 가 이 자리로 바꾼다.
     * 배경과 경계를 강조색에서 만든다. 중립 회색을 깔면 종류가 라벨
     * 색으로만 갈리는데 그 차이는 훑어볼 때 눈에 들어오지 않는다.
     */
    .doc-body .markdown-alert {
      margin-block: 1.5rem;
      padding: 1rem 1.125rem;
      border: 1px solid color-mix(in srgb, var(--alert-accent) 25%, transparent);
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--alert-accent) 8%, transparent);
    }

    .doc-body .markdown-alert-note {
      --alert-accent: var(--primary);
    }
    .doc-body .markdown-alert-tip {
      --alert-accent: var(--success);
    }
    .doc-body .markdown-alert-important {
      --alert-accent: var(--info);
    }
    .doc-body .markdown-alert-warning {
      --alert-accent: var(--warning);
    }
    .doc-body .markdown-alert-caution {
      --alert-accent: var(--destructive);
    }

    /* 색만으로 가르지 않는다. 아이콘과 라벨을 함께 둔다. */
    .doc-body .markdown-alert-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--alert-accent);
      font-weight: 600;
    }

    .doc-body .markdown-alert-title svg {
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
    }

    .doc-body .markdown-alert > * + * {
      margin-top: 0.5rem;
    }
    .doc-body .markdown-alert > :first-child {
      margin-top: 0;
    }
    .doc-body .markdown-alert > :last-child {
      margin-bottom: 0;
    }

    /* 인수 조건이 사는 자리다. 표식을 지우고 칸을 앞에 세운다. */
    .doc-body ul:has(> li > .task-check) {
      list-style: none;
      padding-left: 0;
    }

    .doc-body li:has(> .task-check) {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .doc-body .task-check {
      margin-top: 0.35rem;
      flex-shrink: 0;
      width: 0.9rem;
      height: 0.9rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--background);
    }

    /* 확인된 것은 채우고 표시를 얹는다. 색만으로 가르지 않기 위해 모양도 함께 바꾼다. */
    .doc-body .task-check-done {
      border-color: var(--primary);
      background:
        linear-gradient(to bottom right, transparent 45%, var(--primary-foreground) 45%) no-repeat,
        var(--primary);
      position: relative;
    }

    .doc-body .task-check-done::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--primary);
      clip-path: polygon(20% 52%, 42% 72%, 82% 26%, 90% 36%, 43% 88%, 12% 60%);
      background: var(--primary-foreground);
    }

    /* 그려진 판은 가운데에 두고 폭을 넘지 않게 한다. */
    .doc-body pre.mermaid[data-processed] {
      border: 0;
      background: transparent;
      padding: 0;
      text-align: center;
    }

    .doc-body pre.mermaid svg {
      max-width: 100%;
      height: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownView {
  // --- 계약 --------------------------------------------------------------------------------------
  readonly value = input<string>('');

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
  private readonly injector = inject(Injector);

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');
  protected readonly html = signal('');

  // --- 생성 --------------------------------------------------------------------------------------
  constructor() {
    effect(() => {
      const markdown = this.value();
      if (this.isServer) return;
      void this.draw(markdown);
    });
  }

  // --- 내부 --------------------------------------------------------------------------------------
  private async draw(markdown: string): Promise<void> {
    if (markdown === '') {
      this.html.set('');
      return;
    }

    const { render, languagesIn, hasMermaid, createHighlight, drawDiagrams } = await import(
      './render'
    );

    const langs = languagesIn(markdown);
    const highlight = langs.length === 0 ? undefined : await createHighlight(langs);
    this.html.set(render(markdown, highlight));

    if (!hasMermaid(markdown)) return;

    // 판을 그리려면 넣은 것이 먼저 DOM 에 앉아야 한다. 한 마디 기다리는 것으로는 모자라며,
    // 그린 다음을 Angular 에게 물어야 한다.
    afterNextRender(
      () => {
        const body = this.body()?.nativeElement;
        if (body === undefined) return;
        void drawDiagrams(body, document.documentElement.classList.contains('dark'));
      },
      { injector: this.injector },
    );
  }
}
