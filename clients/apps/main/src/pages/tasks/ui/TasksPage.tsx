import { TaskList } from './TaskList';
import { TaskDetail } from './TaskDetail';
import { TaskCreate } from './TaskCreate';
import type { TaskState } from '../api/tasks';

type Props = { taskId: string; onBack: () => void } | { projectId: string | null; personal?: boolean } | { projectId: string | null; initialState: TaskState };
export function TasksPage(props: Props) {
  return 'taskId' in props ? <TaskDetail id={props.taskId} onBack={props.onBack} /> : 'initialState' in props ? <TaskCreate {...props} /> : <TaskList {...props} />;
}
