/**
 * 메모 하나.
 *
 * <p>프로젝트에 속하지 않는다. 정리되기 전의 자리이며 정리되면 트래커의 작업 아이템으로 올라간다(PRD 1.4).
 */
export interface Memo {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly updatedAt: string;
}

/**
 * 본문 한 줄이 그려지는 모습.
 *
 * <p>본문은 마크다운이지만 화면은 줄의 목록으로 받는다. 받은 문자열을 `innerHTML` 에 넣으면 적은
 * 것이 스크립트로 실행되므로, 줄마다 뜻을 붙여 두고 글자로만 그린다.
 */
export type MemoLine =
  | { readonly kind: 'heading'; readonly level: 1 | 2; readonly text: string }
  | { readonly kind: 'todo'; readonly done: boolean; readonly depth: number; readonly text: string }
  | { readonly kind: 'bullet'; readonly depth: number; readonly text: string }
  | { readonly kind: 'quote'; readonly text: string }
  | { readonly kind: 'blank' }
  | { readonly kind: 'text'; readonly text: string };

/** 두 칸을 한 단계로 센다. 마크다운이 목록을 중첩하는 관례를 그대로 따른다. */
const INDENT_WIDTH = 2;

export function parseMemo(body: string): readonly MemoLine[] {
  return body.split('\n').map(toLine);
}

function toLine(raw: string): MemoLine {
  const indent = raw.length - raw.trimStart().length;
  const depth = Math.floor(indent / INDENT_WIDTH);
  const line = raw.trim();

  if (line === '') return { kind: 'blank' };

  const heading = /^(#{1,2})\s+(.*)$/.exec(line);
  if (heading !== null) {
    return { kind: 'heading', level: heading[1].length === 1 ? 1 : 2, text: heading[2] };
  }

  const todo = /^[-*]\s+\[([ xX])\]\s*(.*)$/.exec(line);
  if (todo !== null) {
    return { kind: 'todo', done: todo[1].toLowerCase() === 'x', depth, text: todo[2] };
  }

  const bullet = /^[-*]\s+(.*)$/.exec(line);
  if (bullet !== null) {
    return { kind: 'bullet', depth, text: bullet[1] };
  }

  const quote = /^>\s?(.*)$/.exec(line);
  if (quote !== null) {
    return { kind: 'quote', text: quote[1] };
  }

  return { kind: 'text', text: line };
}

/**
 * 목록에 낼 한 줄 요약.
 *
 * <p>제목 줄과 빈 줄은 건너뛴다. 목록에는 이미 제목이 서 있으므로 그것을 다시 보이면 두 줄이 같은
 * 말을 한다.
 */
export function summarize(body: string): string {
  const meaningful = parseMemo(body).filter(
    (line): line is Exclude<MemoLine, { kind: 'blank' } | { kind: 'heading' }> =>
      line.kind !== 'blank' && line.kind !== 'heading',
  );

  return meaningful
    .slice(0, 2)
    .map((line) => line.text)
    .join(' · ');
}
