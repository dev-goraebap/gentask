import { NotesPage } from "@/pages/notes";
import { useNavigate, useSearch } from "@tanstack/react-router";
export function NotesRoute() {
  const { project, q, note } = useSearch({ strict: false }) as {
    project?: string;
    q?: string;
    note?: string;
  };
  const navigate = useNavigate();
  return (
    <NotesPage
      selectedId={note ?? null}
      projectId={project}
      q={q ?? ""}
      onFilter={(project, q) => {
        void navigate({ to: "/notes", search: { project, q }, replace: true });
      }}
      onSelect={(id) => {
        void navigate({
          to: "/notes/$noteId",
          params: { noteId: id },
          search: { project, q },
        });
      }}
      onClose={() => {
        void navigate({ to: "/notes", search: { project, q } });
      }}
    />
  );
}
