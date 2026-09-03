import { displayWidth, padTo, shortId } from './format.js';
import type {
  Doc,
  DocFolder,
  DocRevision,
  DocRevisionPage,
  DocSummary,
} from './gentask-client.js';

/**
 * 문서 관련 콘솔 출력 서식 변환 모듈이다. 상세 조회 시 원본 마크다운 텍스트를 그대로 출력한다.
 */

/** 일시 문자열을 분 단위(YYYY-MM-DD HH:mm)까지만 포맷팅한다. */
function when(instant: string): string {
  return instant.replace('T', ' ').slice(0, 16);
}

/** 문서 목록을 콘솔 표 형식으로 출력한다. 비어 있는 경우 빈 목록 메시지를 출력한다. */
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
 * 문서 하나를 출력 형식으로 변환한다.
 *
 * 머리말은 문서의 메타데이터이고 본문은 그 아래에 마크다운 원문 그대로 출력한다. 들여쓰기나
 * 감싸는 문자를 넣지 않는다. 가공하면 받는 쪽이 원문을 복원해야 한다.
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
 * 개정 이력을 콘솔 표 형식으로 출력한다.
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

/** 개정 1건의 요약 정보(버전, 시각, 작성자, 사유)를 한 줄로 포맷팅한다. */
export function revisionHeadline(revision: DocRevision): string {
  const s = revision.summary;
  const comment = s.comment === null || s.comment === '' ? '' : `  ${s.comment}`;
  return `개정 ${s.revisionNo}  ${when(s.createdAt)}  ${s.authorName}${comment}`;
}

/**
 * 특정 개정 시점의 문서를 출력 형식으로 변환한다.
 *
 * 현재 개정을 출력할 때와 같은 형식을 사용한다. 차이가 시점뿐이므로 받는 쪽이 두 가지 형식을
 * 구분할 필요가 없다. 본문은 여기서도 마크다운 원문 그대로 출력한다.
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

/** 폴더 삭제 시 상위로 승격될 하위 항목 개수를 반환한다. */
export function folderHolds(folder: DocFolder): string {
  return `문서 ${folder.documentCount} · 폴더 ${folder.folderCount}`;
}

/**
 * 계층형 폴더 트리를 콘솔에 출력한다.
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

  // 순환 참조 등으로 트리에 편입되지 못한 고아 노드는 루트 계층에 배치한다.
  for (const folder of folders) {
    if (!drawn.has(folder.id)) {
      draw(folder, 0);
    }
  }

  const labelWidth = Math.max(...rows.map((r) => displayWidth(r.label)), 5);
  return rows.map((r) => `${r.id}  ${padTo(r.label, labelWidth)}  ${r.holds}`).join('\n');
}
