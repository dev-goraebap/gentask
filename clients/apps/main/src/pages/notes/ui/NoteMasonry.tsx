import { useLayoutEffect, useRef } from 'react';
import type { Note } from '../api/notes';
import { NoteCard } from './NoteCard';

export function NoteMasonry({ notes, onSelect }: { notes: Note[]; onSelect: (id: string) => void }) {
  const grid = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const items = Array.from(grid.current?.children ?? []) as HTMLElement[];
    const measure = (item: HTMLElement) => {
      const span = `span ${Math.max(1, Math.ceil(item.getBoundingClientRect().height))}`;
      if (item.style.gridRowEnd !== span) item.style.gridRowEnd = span;
    };
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => measure(entry.target as HTMLElement));
    });
    items.forEach(item => {
      measure(item);
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, [notes]);

  return <div ref={grid} className="notes-masonry">
    {notes.map(note => <div key={note.id} className="note-masonry-item">
      <NoteCard note={note} onOpen={() => onSelect(note.id)} />
    </div>)}
  </div>;
}
