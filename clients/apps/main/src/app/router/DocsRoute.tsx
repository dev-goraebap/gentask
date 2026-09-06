import { useIssueStore } from '@/entities/issue';
import { useWorkspaceStore } from '@/entities/workspace';
import { DocumentsPage } from '@/pages/documents/list';
import { resetListing } from '@/shared/ui/listing';
import {
    useNavigate,
    useParams,
    useSearch
} from '@tanstack/react-router';
import { projectItems } from './projectItems';

export function DocsRoute() {
  const { projectId } = useParams({ from: '/projects/$projectId/docs' });
  const { folder } = useSearch({ from: '/projects/$projectId/docs' });
  const navigate = useNavigate();
  const { items } = useIssueStore();
const { projects } = useWorkspaceStore();

  return (
    <DocumentsPage
      projectId={projectId}
      key={`${projectId}:${folder ?? ''}`}
      folderId={folder ?? null}
      onFolderChange={(id) => {
        resetListing(`docs:${projectId}:${id ?? ''}`);
        return navigate({ to: '/projects/$projectId/docs', params: { projectId }, search: id ? { folder: id } : {} });
      }}
      items={projectItems(projectId, items, projects)}
      onOpen={(docId) =>
        navigate({ to: '/projects/$projectId/docs/$docId', params: { projectId, docId } })
      }
    />
  );
}
