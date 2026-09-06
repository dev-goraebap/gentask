import { type Note } from '@/entities/note';

export interface NotesProps {
  readonly notes: readonly Note[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}
