import { ArtifactsPage } from '@/pages/artifacts/list';
import { resetListing } from '@/shared/ui/listing';
import { useNavigate, useSearch } from '@tanstack/react-router';

export function ArtifactsRoute() {
  const search = useSearch({ from: '/artifacts' });
  const navigate = useNavigate();
  return <ArtifactsPage projectId={search.projectId ?? null} personal={!search.projectId} key={`${search.projectId ?? search.scope ?? "all"}:${search.folder ?? ''}`} folderId={search.folder ?? null}
    onFolderChange={folder => { resetListing(`artifacts:null:${folder ?? ''}`); void navigate({ to: '/artifacts', search: { ...search, folder: folder ?? undefined, page: 1 } }); }}
    onOpen={docId => { void navigate({ to: '/artifacts/$docId', params: { docId }, search: { projectId: search.projectId, scope: search.scope, q: search.q, sort: search.sort, direction: search.direction, page: search.page, size: search.size } }); }} />;
}
