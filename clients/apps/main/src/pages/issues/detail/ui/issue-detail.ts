import { type ItemState, type WorkItem } from '@/entities/issue';

export interface IssueDetailProps {
  readonly item: WorkItem;
  readonly parent: WorkItem | null;
  readonly children: readonly WorkItem[];
  readonly onBack: () => void;
  readonly onOpenItem: (id: string) => void;
  readonly onOpenDoc: (docId: string) => void;
  readonly onToggleCriterion: (n: number) => void;
  readonly onStateChange: (state: ItemState) => void;
}
