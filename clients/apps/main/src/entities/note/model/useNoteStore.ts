import { createContext, useContext } from 'react';
import { type Note } from './data';

export interface NoteStore {
  readonly notes: readonly Note[];
  readonly saveNote: (id: string | null, body: string, files: readonly File[]) => void;
  readonly removeNote: (id: string) => void;
  readonly moveNote: (id: string, targetId: string) => void;
  readonly addNote: (title: string, body: string) => void;
}

export const Context = createContext<NoteStore | null>(null);

export function useNoteStore(): NoteStore {
  const value = useContext(Context);
  if (!value) throw new Error('NoteProvider 안에서만 사용합니다.');
  return value;
}
