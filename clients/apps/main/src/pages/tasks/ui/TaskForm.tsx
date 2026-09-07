import {type Task,STATES,editTask,changeTaskState,assignTask,deleteTask,type TaskState} from '../api/tasks';
import {useWorkspaceStore,membersOptions} from '@/entities/workspace';
import {Button,Text,TextInput,TextArea,DateInput,Selector,VStack,HStack} from '@astryxdesign/core';
import {useQuery} from '@tanstack/react-query';
import {useState,type ComponentProps} from 'react';
import {useTaskAction} from '../model/useTaskAction';import {TaskArtifacts} from './TaskArtifacts';import {TaskFiles} from './TaskFiles';
export function TaskForm({task,onDeleted}:{task:Task;onDeleted:()=>void}){
 const {projects}=useWorkspaceStore(),action=useTaskAction();
 const writable=task.projectId===null||['owner','editor'].includes(projects.find(p=>p.id===task.projectId)?.role??'');
 const members=useQuery({...membersOptions(task.projectId??''),enabled:task.projectId!==null});
 const [title,setTitle]=useState(task.title),[note,setNote]=useState(task.note),[dueDate,setDueDate]=useState<ComponentProps<typeof DateInput>['value']>((task.dueDate??undefined) as ComponentProps<typeof DateInput>['value']),[saved,setSaved]=useState(false);
 const disabled=!writable||action.isPending;
 const save=()=>action.mutate(async()=>{await editTask(task.id,{title:title.trim(),note,dueDate:dueDate??null,remindAt:task.remindAt});setSaved(true);});
 return <VStack padding={3} gap={5} style={{overflowY:'auto',flex:1,minHeight:0}}>
 <VStack gap={3}>
 <Text type="supporting">{task.projectName??'개인 작업'}</Text>
 <TextInput label="제목" value={title} onChange={v=>{setTitle(v);setSaved(false);}} isReadOnly={!writable} isDisabled={action.isPending}/>
 <Selector label="상태" value={task.state} options={STATES} isDisabled={disabled} onChange={state=>action.mutate(()=>changeTaskState(task.id,state as TaskState))}/>
 {task.projectId?<><Selector label="담당자" placeholder="미지정" value={task.assigneeId??''} options={[{value:'',label:'미지정'},...(members.data??[]).map(m=>({value:m.id,label:m.name}))]} hasSearch isLoading={members.isPending} isDisabled={disabled||!!members.error} onChange={id=>action.mutate(()=>assignTask(task.id,id||null))}/>{members.error?<Text role="alert">{members.error.message}</Text>:null}</>:null}
 <DateInput label="마감일" value={dueDate} onChange={v=>{setDueDate(v);setSaved(false);}} hasClear isDisabled={disabled}/>
 <TextArea label="설명" value={note} onChange={v=>{setNote(v);setSaved(false);}} rows={5} isReadOnly={!writable} isDisabled={action.isPending}/>
 {writable?<HStack gap={2} align="center"><Button label="저장" variant="primary" onClick={save} isLoading={action.isPending} isDisabled={!title.trim()}/>{saved?<Text role="status" type="supporting">저장했습니다.</Text>:null}</HStack>:null}
 {action.error?<Text role="alert">{action.error.message}</Text>:null}
 </VStack>
 <TaskArtifacts task={task} writable={writable}/><TaskFiles taskId={task.id} writable={writable}/>
 {writable?<Button label="작업 삭제" variant="ghost" isDisabled={action.isPending} onClick={()=>{if(window.confirm('이 작업과 연결된 첨부파일을 삭제할까요?'))action.mutate(async()=>{await deleteTask(task.id);onDeleted();});}}/>:null}
 </VStack>;
}
