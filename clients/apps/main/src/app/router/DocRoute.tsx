import { Button, EmptyState } from '@astryxdesign/core';
import { DOCS } from '@/entities/document';
import { useIssueStore } from '@/entities/issue';
import { useWorkspaceStore } from '@/entities/workspace';
import { DocumentDetailPage } from '@/pages/documents/detail';
import {
    useNavigate,
    useParams
} from '@tanstack/react-router';
import { projectItems } from './projectItems';

export function DocRoute() {
  const { projectId, docId } = useParams({ from: '/projects/$projectId/docs/$docId' });
  const navigate = useNavigate();
  const { items } = useIssueStore();
const { projects } = useWorkspaceStore();
  const doc = DOCS.find((d) => d.id === docId && (d.projectId ?? 'dental') === projectId);

  if (!doc) return <EmptyState title="문서를 찾을 수 없습니다" actions={<Button label="목록으로" onClick={() => navigate({ to: '/projects/$projectId/docs', params: { projectId }, search: {} })} />} />;

  return (
    <DocumentDetailPage
      doc={doc}
      items={projectItems(projectId, items, projects)}
      onBack={() => navigate({ to: '/projects/$projectId/docs', params: { projectId }, search: doc.folderId ? { folder: doc.folderId } : {} })}
      onOpenItem={(itemId) =>
        navigate({ to: '/projects/$projectId/issues/$itemId', params: { projectId, itemId } })
      }
    />
  );
}
