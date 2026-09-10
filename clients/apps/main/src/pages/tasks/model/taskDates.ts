import type { TaskDates } from '../api/tasks';
import type { TaskFilters } from './filters';
export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function taskDates(filters: TaskFilters, today: string): TaskDates {
  if (filters.dateMode === 'all') return {};
  if (filters.dateMode === 'undated') return {undated: true};
  if (filters.dateMode === 'today') return {date: today, includeOverdue: true};
  return {date: filters.date || today};
}
