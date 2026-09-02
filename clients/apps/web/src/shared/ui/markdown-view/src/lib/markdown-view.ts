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
  viewChild,
} from '@angular/core';

/**
 * 마크다운을 읽는 자리.
 *
 * <p>트래커의 두 번째 소비자가 에이전트다. 사람이 손으로 적는 것보다 명령줄로 들어오는 글이 많으므로,
 * 잘 <b>보이는</b> 것이 잘 적히는 것만큼 중요하다.
 *
 * <p>서식은 `doc-body.css` 가 갖는다. 적는 자리도 같은 것을 입으므로 컴포넌트가 아니라 전역에 둔다 —
 * 한쪽에 두면 그 화면이 서 있을 때만 서식이 붙어 여는 순서에 따라 달라 보인다.
 */
@Component({
  selector: 'app-markdown-view',
  template: `<div #body class="doc-body prose max-w-none" [innerHTML]="html()"></div>`,
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
