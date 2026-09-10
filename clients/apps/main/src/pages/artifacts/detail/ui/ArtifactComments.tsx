import { commentsOptions, createArtifactComment, deleteArtifactComment, editArtifactComment } from '@/entities/artifact';
import { useSession } from '@/entities/session';
import { LazyDocumentEditor } from '@/shared/ui/lazy-document-editor';
import type { TextAnchor } from '@/shared/ui/document-editor';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { RequestState } from '@/shared/ui/request-state';

export function ArtifactComments({ projectId, artifactId, versionNo, body, writable }: {
  projectId: string | null; artifactId: string; versionNo: number; body: string; editorState?: string | null; writable: boolean;
}) {
  const query = useQuery(commentsOptions(projectId, artifactId, versionNo));
  const client = useQueryClient();
  const { data: me } = useSession();
  const refresh = () => client.invalidateQueries({ queryKey: commentsOptions(projectId, artifactId, versionNo).queryKey });
  const comments = (query.data || []).flatMap(c => { if (!c.textAnchor) return []; try { return [{ id: c.id, body: c.body, author: c.authorName, own: c.authorId === me?.id, anchor: JSON.parse(c.textAnchor) as TextAnchor }]; } catch { return []; } });
  const legacy = (query.data || []).filter(c => !c.textAnchor);
  return <>
    {query.error && <RequestState error={query.error} retry={() => void query.refetch()} />}
    <Suspense fallback={<p>문서를 불러오는 중입니다.</p>}><LazyDocumentEditor initialMarkdown={body} readOnly comments={comments}
      onComment={writable && query.data ? async (anchor, text) => { await createArtifactComment(projectId, artifactId, versionNo, { body: text, textAnchor: JSON.stringify(anchor) }); await refresh(); } : undefined}
      onEditComment={async (id, text) => { await editArtifactComment(artifactId, versionNo, id, text); await refresh(); }}
      onDeleteComment={async id => { await deleteArtifactComment(projectId, artifactId, versionNo, id); await refresh(); }} /></Suspense>
    {legacy.length > 0 && <details><summary>이전 코멘트 {legacy.length}개</summary>{legacy.map(c => <article key={c.id}><strong>{c.authorName}</strong><blockquote>{c.blockSource}</blockquote><p>{c.body}</p></article>)}</details>}
  </>;
}
