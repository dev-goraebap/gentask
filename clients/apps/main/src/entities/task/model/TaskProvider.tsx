import { TODAY } from '@/shared/config';
import { useMemo, useState, type ReactNode } from 'react';
import { INITIAL_TASKS, type Task } from './data';

import { Context, type TaskStore } from './useTaskStore';

export function TaskProvider({ children }: { readonly children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const value = useMemo<TaskStore>(() => ({
    tasks,
    addTask: (title) =>
      setTasks((prev) => [
        {
          id: `T${Date.now()}`,
          title,
          note: '',
          dueDate: null,
          remindAt: null,
          important: false,
          myDayOn: null,
          completedAt: null,
          createdAt: new Date().toISOString().slice(0, 16),
          files: [],
        },
        ...prev,
      ]),
    patchTask: (id, patch) =>
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    toggleTaskDone: (id) =>
      setTasks((prev) =>
        prev.map((t) =>
          t.id !== id
            ? t
            : {
              ...t,
              completedAt: t.completedAt ? null : `${TODAY}T12:00`,
            },
        ),
      )
  }), [tasks]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
