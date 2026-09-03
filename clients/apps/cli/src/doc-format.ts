import { displayWidth, padTo, shortId } from './format.js';
import type {
  Doc,
  DocFolder,
  DocRevision,
  DocRevisionPage,
  DocSummary,
} from './gentask-client.js';

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

/**
 * 개정 이력을 표로 그린다.
 *
 * <p>최근 것부터 오는 것은 서버가 정한 순서이며 여기서 다시 세우지 않는다. 한 쪽에 담기지 않으면
 * 무엇이 남았는지와 다음 쪽을 어떻게 부르는지를 마지막 줄이 말한다(DOC-004 A3).
 *
 * <p>비어 있다고 말하는 줄은 없다. 세우는 것이 곧 첫 개정이므로 이력이 없는 문서는 없고(DOC-004 A2),
 * 줄이 하나도 오지 않는 것은 없는 쪽을 부른 경우뿐이다.
 */
export function formatRevisions(page: DocRevisionPage): string {
  const first = page.page * page.size + 1;
  if (page.items.length === 0) {
    return `${page.page} 쪽에는 개정이 없습니다. 전체 ${page.total} 건입니다.`;
  }

  const rows = page.items.map((revision) => ({
    no: String(revision.revisionNo),
    when: when(revision.createdAt),
    author: revision.authorName,
    comment: revision.comment ?? '',
  }));

  const noWidth = Math.max(...rows.map((r) => r.no.length));
  const authorWidth = Math.max(...rows.map((r) => displayWidth(r.author)));
  const table = rows
    .map(
      (r) =>
        `${' '.repeat(noWidth - r.no.length)}${r.no}  ${r.when}  ${padTo(r.author, authorWidth)}  ${r.comment}`.trimEnd(),
    )
    .join('\n');

  const last = first + page.items.length - 1;
  if (last >= page.total) {
    return table;
  }
  return [
    table,
    '',
    `전체 ${page.total} 건 중 ${first}–${last} 째입니다. 다음은 --page ${page.page + 1} 로 봅니다.`,
  ].join('\n');
}

/** 개정 하나를 한 줄로 짚는다. 되돌리기가 어느 시점으로 가는지를 보이는 자리가 이것이다. */
export function revisionHeadline(revision: DocRevision): string {
  const s = revision.summary;
  const comment = s.comment === null || s.comment === '' ? '' : `  ${s.comment}`;
  return `개정 ${s.revisionNo}  ${when(s.createdAt)}  ${s.authorName}${comment}`;
}

/**
 * 그때의 문서를 펼친다.
 *
 * <p>지금 참인 것을 펼치는 자리와 같은 모양으로 낸다. 다른 것은 시점뿐이므로 받는 쪽이 두 가지
 * 모양을 알아야 할 이유가 없다. 본문은 여기서도 원문 그대로 간다.
 */
export function formatRevision(revision: DocRevision): string {
  const s = revision.summary;
  const lines = [
    `${revision.title}`,
    `  개정     ${s.revisionNo}`,
    `  남긴이   ${s.authorName}`,
    `  남긴때   ${when(s.createdAt)}`,
  ];

  if (s.comment !== null && s.comment !== '') {
    lines.push(`  사유     ${s.comment}`);
  }
  if (revision.body !== '') {
    lines.push('', revision.body);
  }

  return lines.join('\n');
}

/** 폴더가 바로 아래에 담은 것. 지우기가 무엇을 위로 올리는지 세는 자리도 이것이다(DOC-008 A7). */
export function folderHolds(folder: DocFolder): string {
  return `문서 ${folder.documentCount} · 폴더 ${folder.folderCount}`;
}

/**
 * 폴더를 계층이 보이게 그린다.
 *
 * <p>서버는 평평한 목록에 `parentId` 를 실어 주고 트리를 세우지 않는다. 깊이를 제한하지 않으므로
 * 조립한 모양이 한 화면에 담긴다는 보장이 없고, 어디까지 펼칠지는 보는 쪽이 안다(DOC-008).
 *
 * <p>담긴 자리가 목록에 없는 폴더는 뿌리에 둔다. 그런 줄은 서지 않아야 하지만, 서면 어느 가지에도
 * 걸리지 않아 목록에서 통째로 사라진다. 보이지 않는 것보다 뿌리에 서는 편이 낫다.
 */
export function formatFolders(folders: readonly DocFolder[]): string {
  if (folders.length === 0) {
    return '폴더가 없습니다.';
  }

  const known = new Set(folders.map((folder) => folder.id));
  const children = new Map<string, DocFolder[]>();
  for (const folder of folders) {
    const parent = folder.parentId !== null && known.has(folder.parentId) ? folder.parentId : '';
    children.set(parent, [...(children.get(parent) ?? []), folder]);
  }

  const rows: Array<{ id: string; label: string; holds: string }> = [];
  const drawn = new Set<string>();
  const draw = (folder: DocFolder, depth: number): void => {
    drawn.add(folder.id);
    rows.push({
      id: shortId(folder.id),
      label: `${'  '.repeat(depth)}${folder.name}`,
      holds: folderHolds(folder),
    });
  };
  const walk = (parent: string, depth: number): void => {
    const here = [...(children.get(parent) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    for (const folder of here) {
      draw(folder, depth);
      walk(folder.id, depth + 1);
    }
  };
  walk('', 0);

  // 어느 가지에도 걸리지 않은 것. 서버가 고리를 막으므로 서지 않을 줄이지만, 서면 뿌리에 세운다.
  for (const folder of folders) {
    if (!drawn.has(folder.id)) {
      draw(folder, 0);
    }
  }

  const labelWidth = Math.max(...rows.map((r) => displayWidth(r.label)), 5);
  return rows.map((r) => `${r.id}  ${padTo(r.label, labelWidth)}  ${r.holds}`).join('\n');
}
