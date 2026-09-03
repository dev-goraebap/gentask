/** 문서를 담는 폴더. 폴더가 폴더를 담고 깊이를 제한하지 않는다(DOC-008). */
export interface DocFolder {
  readonly id: string;
  readonly name: string;
  /** 담긴 자리. 값이 없으면 뿌리에 선다. */
  readonly parentId: string | null;
  /** 바로 아래에 담긴 문서 수. 지우기를 되묻는 자리가 이것을 보인다(DOC-008 A7). */
  readonly docCount: number;
  /** 바로 아래에 담긴 폴더 수. */
  readonly folderCount: number;
  readonly updatedOn: string;
}

export interface DocSummary {
  readonly id: string;
  readonly title: string;
  /** 담긴 폴더. 값이 없으면 뿌리에 선다. */
  readonly folderId: string | null;
  readonly updatedOn: string;
  /** 작업 아이템 잇기는 아직 서버에 자리가 없다(GT-72). 실어 온 줄은 언제나 0 이다. */
  readonly linkedIssueCount: number;
  /** 첨부는 아직 서버에 자리가 없다(GT-71). 실어 온 줄은 언제나 0 이다. */
  readonly attachmentCount: number;
}

/**
 * 문서에 붙는 파일. 본문에 들어가는 그림과 달리 문서 자체에 붙는다.
 *
 * <p><b>아직 목이다.</b> 서버에 자리가 없어(GT-71) 언제나 비어 있다.
 */
export interface DocAttachment {
  readonly name: string;
  readonly size: string;
}

/**
 * 이 문서를 거는 작업 아이템.
 *
 * <p><b>아직 목이다.</b> 서버에 자리가 없어(GT-72) 언제나 비어 있다.
 */
export interface DocLinkedIssue {
  readonly id: string;
  readonly title: string;
}

export interface Doc extends DocSummary {
  /**
   * 지금 참인 개정의 본문. <b>마크다운 원문</b>이다.
   *
   * <p>덩이로 나눠 받지 않는다. 받은 문자열을 그대로 심으면 다른 사람이 적은 것이 스크립트로
   * 실행되므로, 그리는 자리(`markdown-view`)가 그 경로를 닫는다 — 원문 자체는 위험하지 않고
   * 위험은 그리는 자리에 있다(DOC-002 A5).
   */
  readonly body: string;
  readonly authorName: string;
  /** 지금 참인 개정의 번호. 1부터 매긴다. */
  readonly revisionNo: number;
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
