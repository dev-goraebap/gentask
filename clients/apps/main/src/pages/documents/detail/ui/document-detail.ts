import { type Doc } from '@/entities/document';
import { type WorkItem } from '@/entities/issue';

export interface DocDetailProps {
  readonly doc: Doc;
  readonly items: readonly WorkItem[];
  readonly onBack: () => void;
  readonly onOpenItem: (id: string) => void;
}
