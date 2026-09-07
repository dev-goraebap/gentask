import type { SortOption, SortValue } from '@/shared/ui/listing';
import { STATES, type Task } from '../api/tasks';
export const STATE_OPTIONS = STATES;
export const SORT_OPTIONS: SortOption[] = [
  { value: 'created', label: '생성일', defaultDirection: 'desc' },
  { value: 'due', label: '마감일', defaultDirection: 'asc' },
  { value: 'title', label: '제목', defaultDirection: 'asc' },
];
export type TaskFilters = { states: string[]; sort: SortValue };
export const DEFAULT_FILTERS: TaskFilters = { states: ['TODO', 'IN_PROGRESS'], sort: { key: 'created', direction: 'desc' } };
export function filterTasks(tasks: Task[], query: string, filters: TaskFilters) {
  const term = query.trim().toLocaleLowerCase();
  return tasks.filter(task => (!filters.states.length || filters.states.includes(task.state)) &&
    [task.title, task.projectName, task.assigneeName].filter(Boolean).join(' ').toLocaleLowerCase().includes(term))
    .sort((a, b) => {
      if (filters.sort.key === 'due' && (!a.dueDate || !b.dueDate)) {
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && !b.dueDate) return -1;
      }
      const key = filters.sort.key === 'due' ? 'dueDate' : filters.sort.key === 'title' ? 'title' : 'createdAt';
      return (filters.sort.direction === 'asc' ? 1 : -1) * (a[key] ?? '').localeCompare(b[key] ?? '', 'ko') || a.id.localeCompare(b.id);
    });
}
