import { NotesPage } from '@/pages/notes';
import { useNavigate, useSearch } from '@tanstack/react-router';
export function NotesRoute() {
  const search = useSearch({ from: '/notes' });
  const navigate = useNavigate();
  return <NotesPage selectedId={search.note ?? null} projectId={search.projectId ?? search.project} personal={search.scope === 'personal'} q={search.q ?? ''} sort={search.sort ?? 'created-desc'}
    onSort={sort => void navigate({ to: '/notes', search: { ...search, sort: sort === 'created-desc' ? undefined : sort }, replace: true })}
    onFilter={(_, q) => void navigate({ to: '/notes', search: { ...search, q }, replace: true })}
    onSelect={note => void navigate({ to: '/notes', search: { ...search, note } })}
    onClose={() => void navigate({ to: '/notes', search: { ...search, note: undefined } })} />;
}
