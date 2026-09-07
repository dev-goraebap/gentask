import type { ArtifactView } from '@/entities/artifact';
export interface DocDetailProps {
  readonly artifact: ArtifactView;
  readonly projectId: string;
  readonly onBack: () => void;
}
