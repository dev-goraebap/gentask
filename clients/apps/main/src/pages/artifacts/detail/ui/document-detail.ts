import type { ArtifactView } from '@/entities/artifact';
export interface DocDetailProps {
  readonly artifact: ArtifactView;
  readonly projectId: string;
  readonly onBack: () => void;
  readonly selectedVersion: number | null;
  readonly onSelectVersion: (version: number | null) => void;
}

export const formatArtifactDate = (value: string) => new Date(value).toLocaleString('ko-KR', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
