import {taskOptions} from '../api/tasks';
import {useQuery} from '@tanstack/react-query';
import {RequestState} from '@/shared/ui/request-state';
import {TaskForm} from './TaskForm';
export function TaskDetail({id,onDeleted}:{id:string;onDeleted:()=>void}){const query=useQuery(taskOptions(id));return query.data?<TaskForm task={query.data} onDeleted={onDeleted}/>:<RequestState error={query.error} retry={()=>void query.refetch()}/>;}
