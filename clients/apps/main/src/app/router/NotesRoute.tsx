import { useNoteStore } from '@/entities/note';
import { NotesPage } from '@/pages/notes';
import {
    useNavigate,
    useParams
} from '@tanstack/react-router';

export function NotesRoute() {
  const params = useParams({ strict: false }) as { noteId?: string };
  const navigate = useNavigate();
  const { notes } = useNoteStore();

  return (
    <NotesPage
      notes={notes}
      selectedId={params.noteId ?? null}
      onSelect={(id) => navigate({ to: '/notes/$noteId', params: { noteId: id } })}
    />
  );
}
