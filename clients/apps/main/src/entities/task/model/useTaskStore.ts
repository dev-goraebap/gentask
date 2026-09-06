import { createContext, useContext } from 'react';
import { type Task } from './data';

export interface TaskStore {
  readonly tasks: readonly Task[];
  readonly addTask: (title: string) => void;
  readonly patchTask: (id: string, patch: Partial<Task>) => void;
  readonly toggleTaskDone: (id: string) => void;
}

export const Context = createContext<TaskStore | null>(null);

export function useTaskStore(): TaskStore {
  const value = useContext(Context);
  if (!value) throw new Error('TaskProvider 안에서만 사용합니다.');
  return value;
}
