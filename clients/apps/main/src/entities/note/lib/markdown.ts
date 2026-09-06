
import { type Note } from '../model/data';

export function noteMarkdown(note?: Note): string {
  if (!note) return '';
  return note.title ? `# ${note.title}\n\n${note.body}` : note.body;
}

export function noteLabel(note: Note): string {
  return noteMarkdown(note).split('\n').find((line) => line.trim())?.replace(/^#+\s*/, '').slice(0, 60) || note.files?.[0]?.name || '기록';
}
