import { artifactOptions } from '@/entities/artifact';
import { ArtifactDetailPage } from '@/pages/artifacts/detail';
import { RequestState } from '@/shared/ui/request-state';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

export function DocRoute() {
  const { projectId, docId } = useParams({ from: '/projects/$projectId/artifacts/$docId' });
  const navigate = useNavigate();
  const search = useSearch({ from: '/projects/$projectId/artifacts/$docId' });
  const query = useQuery(artifactOptions(projectId, docId));
  if (!query.data) return <RequestState error={query.error} retry={() => { void query.refetch(); }} />;
  return <>
    {query.isRefetchError ? <RequestState error={query.error} retry={() => { void query.refetch(); }} /> : null}
    <ArtifactDetailPage key={projectId + ':' + docId} projectId={projectId} artifact={query.data}
      onBack={() => navigate({ to: '/projects/$projectId/artifacts', params: { projectId }, search: { ...search, folder: query.data.summary.folderId ?? undefined } })} />
  </>;
}
