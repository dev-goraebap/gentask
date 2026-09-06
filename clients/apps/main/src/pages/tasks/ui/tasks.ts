import { type TaskViewKey } from '@/entities/task';

export const DRAWER_WIDTH = 380;

export interface TasksProps {
  readonly view: TaskViewKey;
  readonly taskId: string | null;
  readonly onViewChange: (view: TaskViewKey) => void;
  readonly onSelect: (id: string | null) => void;
}
