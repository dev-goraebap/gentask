import { ArtifactsPage } from '@/pages/artifacts/list';
import { resetListing } from '@/shared/ui/listing';
import { useNavigate, useSearch } from '@tanstack/react-router';

export function PersonalArtifactsRoute() {
  const search = useSearch({ from: '/artifacts' });
  const navigate = useNavigate();
  return <ArtifactsPage projectId={null} key={`personal:${search.folder ?? ''}`} folderId={search.folder ?? null}
    onFolderChange={folder => { resetListing(`artifacts:null:${folder ?? ''}`); void navigate({ to: '/artifacts', search: folder ? { folder } : {} }); }}
    onOpen={docId => { void navigate({ to: '/artifacts/$docId', params: { docId }, search: { q: search.q, sort: search.sort, direction: search.direction, page: search.page, size: search.size } }); }} />;
}
