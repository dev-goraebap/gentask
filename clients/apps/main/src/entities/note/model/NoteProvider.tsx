import { useMemo, useState, type ReactNode } from 'react';
import { INITIAL_NOTES, type Note } from './data';

import { Context, type NoteStore } from './useNoteStore';

export function NoteProvider({ children }: { readonly children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const value = useMemo<NoteStore>(() => ({
    notes,
    saveNote: (id, body, files) => setNotes((prev) => {
      const note = { id: id ?? crypto.randomUUID(), title: '', body, files, updatedAt: '방금' };
      return id ? prev.map((n) => n.id === id ? note : n) : [note, ...prev];
    }),
    removeNote: (id) => setNotes((prev) => prev.filter((n) => n.id !== id)),
    moveNote: (id, targetId) => setNotes((prev) => {
      const from = prev.findIndex((n) => n.id === id), to = prev.findIndex((n) => n.id === targetId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev]; next.splice(to, 0, next.splice(from, 1)[0]); return next;
    }),
    addNote: (title, body) => setNotes((prev) => [{ id: crypto.randomUUID(), title, body, updatedAt: '방금' }, ...prev])
  }), [notes]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
