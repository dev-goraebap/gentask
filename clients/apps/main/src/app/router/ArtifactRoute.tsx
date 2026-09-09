import { artifactOptions } from '@/entities/artifact';
import { ArtifactDetailPage } from '@/pages/artifacts/detail';
import { RequestState } from '@/shared/ui/request-state';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

export function ArtifactRoute() {
  const { docId } = useParams({ from: '/artifacts/$docId' });
  const search = useSearch({ from: '/artifacts/$docId' });
  const navigate = useNavigate();
  const query = useQuery(artifactOptions(null, docId));
  if (!query.data) return <RequestState error={query.error} retry={() => { void query.refetch(); }} />;
  const { version, ...listingSearch } = search;
  return <>
    {query.isRefetchError ? <RequestState error={query.error} retry={() => { void query.refetch(); }} /> : null}
    <ArtifactDetailPage key={docId} projectId={query.data.summary.projectId ?? null} artifact={query.data} selectedVersion={version ?? null}
      onSelectVersion={value => { void navigate({ to: '/artifacts/$docId', params: { docId }, search: { ...listingSearch, version: value ?? undefined } }); }}
      onBack={() => { void navigate({ to: '/artifacts', search: { ...listingSearch, folder: query.data.summary.folderId ?? undefined } }); }} />
  </>;
}
