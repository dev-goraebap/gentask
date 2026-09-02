import { displayWidth, padTo, shortId } from './format.js';
import type { Doc, DocSummary } from './gentask-client.js';

/**
 * 문서를 글자로 그린다.
 *
 * <p>화면은 본문을 글자로만 그리지만(DOC-002) 여기가 내는 것은 <b>마크다운 원문</b>이다. 에이전트가
 * 받는 것은 그린 결과가 아니며, 위험은 그리는 자리에 있지 원문 자체에 있지 않다(DOC-002 A5).
 */

/** 시각을 분까지만 보인다. 초는 목록에서 고르는 데 쓰이지 않고 줄만 먹는다. */
function when(instant: string): string {
  return instant.replace('T', ' ').slice(0, 16);
}

/** 목록을 표로 그린다. 비었으면 그 사실을 한 줄로 말한다. */
export function formatDocs(docs: readonly DocSummary[]): string {
  if (docs.length === 0) {
    return '문서가 없습니다.';
  }

  const rows = docs.map((doc) => ({
    id: shortId(doc.id),
    title: doc.title,
    updated: when(doc.updatedAt),
  }));

  const titleWidth = Math.max(...rows.map((r) => displayWidth(r.title)), 5);
  return rows.map((r) => `${r.id}  ${padTo(r.title, titleWidth)}  ${r.updated}`.trimEnd()).join('\n');
}

/**
 * 하나를 펼친다.
 *
 * <p>머리에 붙는 줄은 문서에 <i>대한</i> 것이고 본문은 그 아래에 원문 그대로 간다. 들여쓰거나
 * 감싸지 않는다 — 손대는 순간 받은 쪽이 다시 원문을 만들어야 한다.
 */
export function formatDoc(doc: Doc): string {
  const s = doc.summary;
  const lines = [
    `${s.title}`,
    `  식별자   ${s.id}`,
    `  개정     ${doc.revisionNo}`,
    `  세운이   ${doc.authorName}`,
    `  고친때   ${when(s.updatedAt)}`,
  ];

  if (doc.body !== '') {
    lines.push('', doc.body);
  }

  return lines.join('\n');
}
