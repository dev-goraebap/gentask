import {useMutation,useQueryClient} from '@tanstack/react-query';
export function useTaskAction(){const client=useQueryClient();return useMutation({mutationFn:(run:()=>Promise<unknown>)=>run(),onSuccess:async()=>{await client.invalidateQueries({queryKey:['tasks']});await client.invalidateQueries({queryKey:['projects']});}});}
