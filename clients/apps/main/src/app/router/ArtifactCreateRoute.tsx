import { ArtifactCreatePage } from '@/pages/artifacts/create';
import { useNavigate, useSearch } from '@tanstack/react-router';

export function ArtifactCreateRoute() {
  const search = useSearch({ from: '/artifacts/new' });
  const navigate = useNavigate();
  return <ArtifactCreatePage projectId={search.projectId ?? null} folderId={search.folder ?? null}
    onClose={() => void navigate({ to: '/artifacts', search })}
    onSaved={docId => void navigate({ to: '/artifacts/$docId', params: { docId }, search: { projectId: search.projectId, scope: search.scope } })} />;
}
