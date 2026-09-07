import { planningBody } from './planning';

export interface DocFolder {
  readonly projectId?: string;
  readonly id: string;
  readonly title: string;
  readonly parentId: string | null;
}

export interface Doc {
  readonly projectId?: string;
  readonly id: string;
  readonly folderId: string | null;
  title: string;
  body: string;
  readonly updatedAt: string;
  readonly updatedOn?: string;
  readonly updatedBy: string;
}

const storageKey = 'gentask:prototype:artifacts:v1';
const discoveryFolder: DocFolder = { id: 'discoveries', projectId: 'gentask', title: '발견', parentId: null };
const planning: Doc = { id: 'gentask-planning', projectId: 'gentask', folderId: discoveryFolder.id, title: 'Gentask 기획 초안', body: planningBody, updatedBy: '고재범', updatedAt: '2026. 9. 7.', updatedOn: '2026-09-07' };

function load(): { folders: DocFolder[]; docs: Doc[] } {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (stored && Array.isArray(stored.folders) && Array.isArray(stored.docs) &&
      stored.folders.every((item: DocFolder) => item && typeof item.id === 'string' && typeof item.title === 'string' && (item.parentId === null || typeof item.parentId === 'string')) &&
      stored.docs.every((item: Doc) => item && ['id', 'title', 'body', 'updatedBy', 'updatedAt'].every(key => typeof item[key as keyof Doc] === 'string') && (item.folderId === null || typeof item.folderId === 'string'))) return stored;
    const previous = JSON.parse(localStorage.getItem('gentask:prototype:discoveries:v1') ?? 'null');
    if (Array.isArray(previous)) {
      const docs: Doc[] = previous.filter(item => item?.projectId === 'gentask' && ['id', 'title', 'body', 'author', 'updatedAt'].every(key => typeof item[key] === 'string'))
        .map(item => ({ id: item.id, projectId: item.projectId, folderId: discoveryFolder.id, title: item.title, body: item.body, updatedBy: item.author,
          updatedAt: new Date(item.updatedAt).toLocaleDateString('ko-KR'), updatedOn: item.updatedAt.slice(0, 10) }));
      if (!docs.some(doc => doc.id === planning.id)) docs.unshift(planning);
      return { folders: [discoveryFolder], docs };
    }
  } catch { /* 저장 형식이 손상되었으면 기본 초안을 사용한다. */ }
  return { folders: [discoveryFolder], docs: [planning] };
}

const initial = load();
export const DOC_FOLDERS: DocFolder[] = initial.folders;
export const DOCS: Doc[] = initial.docs;

export function saveDocument(projectId: string, folderId: string | null, title: string, body: string, author: string, id: string = crypto.randomUUID()): string {
  const existing = DOCS.find(doc => doc.id === id && doc.projectId === projectId);
  const now = new Date();
  const doc: Doc = { id, projectId, folderId, title: title.trim(), body, updatedBy: author, updatedAt: now.toLocaleDateString('ko-KR'), updatedOn: now.toISOString().slice(0, 10) };
  const next = existing ? DOCS.map(item => item === existing ? doc : item) : [...DOCS, doc];
  localStorage.setItem(storageKey, JSON.stringify({ folders: DOC_FOLDERS, docs: next }));
  if (existing) Object.assign(existing, doc);
  else DOCS.push(doc);
  return id;
}

export function saveFolder(projectId: string, parentId: string | null, title: string): string {
  const folder: DocFolder = { id: crypto.randomUUID(), projectId, parentId, title: title.trim() };
  localStorage.setItem(storageKey, JSON.stringify({ folders: [...DOC_FOLDERS, folder], docs: DOCS }));
  DOC_FOLDERS.push(folder);
  return folder.id;
}

export function removeProjectDocuments(projectId: string) {
  for (let i = DOCS.length - 1; i >= 0; i--) if ((DOCS[i].projectId ?? 'gentask') === projectId) DOCS.splice(i, 1);
  for (let i = DOC_FOLDERS.length - 1; i >= 0; i--) if ((DOC_FOLDERS[i].projectId ?? 'gentask') === projectId) DOC_FOLDERS.splice(i, 1);
  localStorage.setItem(storageKey, JSON.stringify({ folders: DOC_FOLDERS, docs: DOCS }));
}
