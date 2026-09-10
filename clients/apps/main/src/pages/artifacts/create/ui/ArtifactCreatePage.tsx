import { ArtifactEditor } from '@/features/edit-artifact';
import { foldersOptions } from '@/entities/artifact';
import { RequestState } from '@/shared/ui/request-state';
import { useQuery } from '@tanstack/react-query';

export function ArtifactCreatePage({ projectId, folderId, onClose, onSaved }: {
  projectId: string | null; folderId: string | null; onClose: () => void; onSaved: (id: string) => void;
}) {
  const folders = useQuery(foldersOptions(projectId));
  if (folderId && !folders.data) return <RequestState error={folders.error} retry={() => void folders.refetch()} />;
  if (folderId && !folders.data?.some(folder => folder.id === folderId)) return <p role="alert">폴더를 찾을 수 없습니다.</p>;
  return <ArtifactEditor projectId={projectId} folderId={folderId} onClose={onClose} onSaved={onSaved} />;
}
