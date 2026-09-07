
export type DocSort = 'title' | 'updated';

export const SORT_LABEL: Record<DocSort, string> = {
  title: '이름 순',
  updated: '수정일 순',
};

export interface DocsProps {
  readonly projectId: string | null;
  readonly folderId: string | null;
  readonly onFolderChange: (id: string | null) => void;
  readonly onOpen: (docId: string) => void;
}
