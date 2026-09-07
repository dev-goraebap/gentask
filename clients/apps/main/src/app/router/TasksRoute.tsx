import { TasksPage } from '@/pages/tasks';
import { useParams } from '@tanstack/react-router';
export function TasksRoute(){const {projectId}=useParams({strict:false});return <TasksPage key={projectId??'personal'} projectId={projectId??null}/>;}
