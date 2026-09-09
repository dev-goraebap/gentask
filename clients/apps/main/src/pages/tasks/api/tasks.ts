import { extractImageMetadata } from "@/shared/lib/image-color";
import { resourceSearch } from '@/shared/config';
import { createdId, get, request } from '@/shared/api';
import { queryOptions } from '@tanstack/react-query';
export type TaskState = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Task = { id:string; title:string; note:string; state:TaskState; projectId:string|null; projectName:string|null; assigneeId:string|null; assigneeName:string|null; dueDate:string|null; remindAt:string|null; createdAt:string };
export const STATES: {value:TaskState;label:string}[] = [{value:'TODO',label:'할 일'},{value:'IN_PROGRESS',label:'진행 중'},{value:'DONE',label:'완료'}];
export const tasksOptions=(projectId:string|null,personal=false)=>queryOptions({queryKey:['tasks','list',projectId,personal],queryFn:({signal})=>get<Task[]>('/tasks'+resourceSearch(projectId,personal),signal)});
export const taskOptions=(id:string)=>queryOptions({queryKey:['tasks','detail',id],queryFn:({signal})=>get<Task>('/tasks/'+id,signal)});
export const addTask=async(projectId:string|null,title:string)=>createdId((await request('/tasks',{method:'POST',body:JSON.stringify({title,projectId})})).location);
export const editTask=(id:string,input:{title:string;note:string;dueDate:string|null;remindAt:string|null})=>request('/tasks/'+id,{method:'PATCH',body:JSON.stringify(input)});
export const changeTaskState=(id:string,state:TaskState)=>request('/tasks/'+id+'/state',{method:'PATCH',body:JSON.stringify({state})});
export const assignTask=(id:string,assigneeId:string|null)=>request('/tasks/'+id+'/assignee',{method:'PATCH',body:JSON.stringify({assigneeId})});
export const deleteTask=(id:string)=>request('/tasks/'+id,{method:'DELETE'});
export const taskArtifactsOptions=(id:string)=>queryOptions({queryKey:['tasks',id,'artifacts'],queryFn:({signal})=>get<{id:string;title:string}[]>('/tasks/'+id+'/artifacts',signal)});
export const linkTaskArtifact=(id:string,artifactId:string,linked:boolean)=>request('/tasks/'+id+'/artifacts/'+artifactId,{method:linked?'PUT':'DELETE'});
export type TaskFile={id:string;fileName:string;size:number;url:string};
export const taskFilesOptions=(id:string)=>queryOptions({queryKey:['tasks',id,'files'],queryFn:({signal})=>get<TaskFile[]>('/tasks/'+id+'/files',signal)});
export const removeTaskFile=(id:string,fileId:string)=>request('/tasks/'+id+'/files/'+fileId,{method:'DELETE'});
export async function uploadTaskFile(id:string,file:File){
 const contentType=file.type||'application/octet-stream';
 const {data}=await request<{objectKey:string;url:string}>('/attachments/presign',{method:'POST',body:JSON.stringify({slot:'TASK_FILES',fileName:file.name,contentType,size:file.size,...await extractImageMetadata(file)})});
 const target=new URL(data.url);
 const uploadUrl=import.meta.env.DEV&&target.origin===import.meta.env.DEV_STORAGE_ORIGIN ? '/__storage'+target.pathname+target.search : data.url;
 let result:Response;
 try { result=await fetch(uploadUrl,{method:'PUT',headers:{'Content-Type':contentType},body:file,credentials:'omit'}); } catch { throw new Error('파일 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
 if(!result.ok)throw new Error('파일을 업로드하지 못했습니다. 다시 시도해 주세요.');
 await request('/tasks/'+id+'/files',{method:'POST',body:JSON.stringify({objectKey:data.objectKey,fileName:file.name,contentType})});
}

export type LinkedNote = {id:string;preview:string;archived:boolean};
export const taskNotesOptions = (id:string) => queryOptions({queryKey:['tasks',id,'notes'],queryFn:({signal})=>get<LinkedNote[]>('/tasks/'+id+'/notes',signal)});
export const linkTaskNote = (id:string,noteId:string,linked:boolean) => request('/tasks/'+id+'/notes/'+encodeURIComponent(noteId),{method:linked?'PUT':'DELETE'});
