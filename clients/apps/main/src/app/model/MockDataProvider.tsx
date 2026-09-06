import { IssueProvider } from '@/entities/issue';
import { NoteProvider } from '@/entities/note';
import { TaskProvider } from '@/entities/task';
import { WorkspaceProvider } from '@/entities/workspace';
import type { ReactNode } from 'react';



export function MockDataProvider({ children }: { readonly children: ReactNode }) {
  return <WorkspaceProvider><IssueProvider><NoteProvider><TaskProvider>{children}</TaskProvider></NoteProvider></IssueProvider></WorkspaceProvider>;
}
