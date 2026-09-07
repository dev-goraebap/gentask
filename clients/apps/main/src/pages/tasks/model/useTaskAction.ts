import {useMutation,useQueryClient} from '@tanstack/react-query';
export function useTaskAction(taskId?: string){const client=useQueryClient();return useMutation({scope:taskId?{id:`task-autosave:${taskId}`}:undefined,mutationFn:(run:()=>Promise<unknown>)=>run(),onSuccess:async()=>{await client.invalidateQueries({queryKey:['tasks']});await client.invalidateQueries({queryKey:['projects']});}});}
