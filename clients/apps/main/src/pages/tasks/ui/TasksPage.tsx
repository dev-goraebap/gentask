import { TaskList } from './TaskList';
import { TaskDetail } from './TaskDetail';

type Props = { taskId: string; onBack: () => void } | { projectId: string | null; personal?: boolean };
export function TasksPage(props: Props) {
  return 'taskId' in props ? <TaskDetail id={props.taskId} onBack={props.onBack} /> : <TaskList {...props} />;
}
