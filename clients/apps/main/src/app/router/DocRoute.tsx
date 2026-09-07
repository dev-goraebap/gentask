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
  const { version, ...listingSearch } = search;
  return <>
    {query.isRefetchError ? <RequestState error={query.error} retry={() => { void query.refetch(); }} /> : null}
    <ArtifactDetailPage key={projectId + ':' + docId} projectId={projectId} artifact={query.data} selectedVersion={version ?? null}
      onSelectVersion={value => { void navigate({ to: '/projects/$projectId/artifacts/$docId', params: { projectId, docId }, search: { ...listingSearch, version: value ?? undefined } }); }}
      onBack={() => navigate({ to: '/projects/$projectId/artifacts', params: { projectId }, search: { ...listingSearch, folder: query.data.summary.folderId ?? undefined } })} />
  </>;
}
