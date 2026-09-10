import { PageLayout, PageContent, PageHeader } from '@/shared/ui/page-layout';
import { WIDTH } from '@/shared/config';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { artifactOptions, type ArtifactView } from '@/entities/artifact';
import { ArtifactDetailPage } from '@/pages/artifacts/detail';
import { RequestState } from '@/shared/ui/request-state';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

export function ArtifactRoute() {
  const { docId } = useParams({ from: '/artifacts/$docId' });
  const search = useSearch({ from: '/artifacts/$docId' });
  const navigate = useNavigate();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const client = useQueryClient();
  const query = useQuery(artifactOptions(null, docId));
  const cachedTitle = client.getQueriesData<ArtifactView['summary'][]>({ queryKey: ['artifacts'] })
    .flatMap(([, data]) => Array.isArray(data) ? data : []).find(item => item.id === docId)?.title;
  if (!query.data) return <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
    header={<PageHeader title={cachedTitle ?? ''}
      titleContent={cachedTitle ? undefined : <span role="status" aria-label="문서 제목을 불러오는 중" style={{ width: '10rem', maxWidth: '100%', height: '1rem', borderRadius: '0.25rem', background: 'var(--color-skeleton)' }} />}
      compact={mobile} onBack={() => void navigate({ to: '/artifacts', search: { projectId: search.projectId, scope: search.scope } })} />}
    content={<PageContent><RequestState error={query.error} retry={() => { void query.refetch(); }} /></PageContent>} />;
  const { version, ...listingSearch } = search;
  return <>
    {query.isRefetchError ? <RequestState error={query.error} retry={() => { void query.refetch(); }} /> : null}
    <ArtifactDetailPage key={docId} projectId={query.data.summary.projectId ?? null} artifact={query.data} selectedVersion={version ?? null}
      onSelectVersion={value => { void navigate({ to: '/artifacts/$docId', params: { docId }, search: { ...listingSearch, version: value ?? undefined } }); }}
      onBack={() => { void navigate({ to: '/artifacts', search: { ...listingSearch, folder: query.data.summary.folderId ?? undefined } }); }} />
  </>;
}
