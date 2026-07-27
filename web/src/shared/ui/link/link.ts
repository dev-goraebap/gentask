import { Directive } from '@angular/core';

/**
 * 텍스트 링크.
 *
 * 잉크(`accent-ink`)를 쓴다 — 채움(`accent`)은 캔버스 위 텍스트로 쓰면 대비가
 * 부족하다(디자인시스템.md §2.2).
 *
 * 밑줄을 기본으로 둔다. 본문 안의 링크를 색으로만 구분하면 색각 이상 사용자가
 * 찾을 수 없다(WCAG 1.4.1 — 색만으로 정보를 전달하지 않는다). 목록이나
 * 내비게이션처럼 링크임이 맥락으로 분명한 곳에서는 호출부가
 * `no-underline`으로 덮는다.
 */
@Directive({
  selector: 'a[ui-link]',
  host: {
    class:
      'text-accent-ink underline decoration-1 underline-offset-2 transition-colors ' +
      'duration-150 ease-standard hover:decoration-2 rounded-tight',
  },
})
export class UiLink {}
