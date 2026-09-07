import { ArtifactsPage } from '@/pages/artifacts/list';
import { resetListing } from '@/shared/ui/listing';
import {
    useNavigate,
    useParams,
    useSearch
} from '@tanstack/react-router';

export function DocsRoute() {
  const { projectId } = useParams({ from: '/projects/$projectId/artifacts' });
  const search = useSearch({ from: '/projects/$projectId/artifacts' });
  const { folder } = search;
  const navigate = useNavigate();

  return (
    <ArtifactsPage
      projectId={projectId}
      key={`${projectId}:${folder ?? ''}`}
      folderId={folder ?? null}
      onFolderChange={(id) => {
        resetListing(`artifacts:${projectId}:${id ?? ''}`);
        return navigate({ to: '/projects/$projectId/artifacts', params: { projectId }, search: id ? { folder: id } : {} });
      }}
      onOpen={(docId) =>
        navigate({ to: '/projects/$projectId/artifacts/$docId', params: { projectId, docId }, search: { q: search.q, sort: search.sort, direction: search.direction, page: search.page, size: search.size } })
      }
    />
  );
}
