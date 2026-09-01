/**
 * 문서 본문의 한 덩이.
 *
 * <p>본문의 원본은 마크다운이지만 화면은 덩이의 목록으로 받는다. 받은 문자열을 그대로 `innerHTML`
 * 에 넣으면 다른 사람이 적은 것이 스크립트로 실행된다. 덩이로 나눠 받으면 각 덩이가 글자로만
 * 그려지므로 그 경로가 열리지 않는다.
 */
export type DocBlock =
  | { readonly kind: 'heading'; readonly text: string }
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'bullets'; readonly items: readonly string[] }
  | { readonly kind: 'code'; readonly text: string };

/** 문서를 담는 폴더. 폴더가 폴더를 담는다. */
export interface DocFolder {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly docCount: number;
  readonly updatedOn: string;
}

export interface DocSummary {
  readonly id: string;
  readonly title: string;
  readonly folderId: string | null;
  readonly updatedOn: string;
  readonly linkedIssueCount: number;
  readonly attachmentCount: number;
}

/** 문서에 붙는 파일. 본문에 들어가는 그림과 달리 문서 자체에 붙는다. */
export interface DocAttachment {
  readonly name: string;
  readonly size: string;
}

export interface DocLinkedIssue {
  readonly id: string;
  readonly title: string;
}

export interface Doc extends DocSummary {
  readonly blocks: readonly DocBlock[];
  readonly authorName: string;
  readonly version: number;
  readonly attachments: readonly DocAttachment[];
  readonly linkedIssues: readonly DocLinkedIssue[];
}

/** 지금 자리에서 위로 올라가는 길. 폴더 하나를 열 때마다 한 단계씩 쌓인다. */
export interface DocCrumb {
  readonly id: string | null;
  readonly name: string;
}

export function buildCrumbs(
  folders: readonly DocFolder[],
  folderId: string | null,
): readonly DocCrumb[] {
  const trail: DocCrumb[] = [];

  let cursor = folderId;
  while (cursor !== null) {
    const folder = folders.find((candidate) => candidate.id === cursor);
    if (folder === undefined) break;
    trail.unshift({ id: folder.id, name: folder.name });
    cursor = folder.parentId;
  }

  return [{ id: null, name: '문서' }, ...trail];
}

export function foldersIn(
  folders: readonly DocFolder[],
  folderId: string | null,
): readonly DocFolder[] {
  return folders.filter((folder) => folder.parentId === folderId);
}

export function docsIn(docs: readonly DocSummary[], folderId: string | null): readonly DocSummary[] {
  return docs.filter((doc) => doc.folderId === folderId);
}
