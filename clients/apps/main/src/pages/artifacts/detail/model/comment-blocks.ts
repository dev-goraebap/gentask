import { parseMarkdown } from '@astryxdesign/core/Markdown';

export type CommentBlock = { start: number; end: number; index: number; label: string };
const labels: Record<string, string> = { paragraph: '문단', heading: '제목', image: '이미지', table: '표', codeblock: '코드', list: '목록', blockquote: '인용문', hr: '구분선' };

export function commentBlocks(body: string): CommentBlock[] {
  return parseMarkdown(body, { sourceRanges: true }).flatMap((block, index) => {
    if (!block.range) return [];
    const { start } = block.range;
    let { end } = block.range;
    while (end > start && /[\r\n]/.test(body[end - 1])) end--;
    return [{ start, end, index, label: `${index + 1}. ${labels[block.type] ?? '블록'}` }];
  });
}

export const blockKey = (start: number | null | undefined, end: number | null | undefined) => start == null ? 'document' : `${start}:${end}`;
