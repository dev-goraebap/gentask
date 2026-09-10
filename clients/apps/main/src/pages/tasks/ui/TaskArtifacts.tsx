import {type Task,taskArtifactsOptions,linkTaskArtifact} from '../api/tasks';
import {artifactsOptions} from '@/entities/artifact';
import {useQuery} from '@tanstack/react-query';
import {Button,Heading,Text,VStack,HStack,Selector} from '@astryxdesign/core';
import {useTaskAction} from '../model/useTaskAction';
import {RequestState} from '@/shared/ui/request-state';
export function TaskArtifacts({task,writable}:{task:Task;writable:boolean}){
 const linked=useQuery(taskArtifactsOptions(task.id)),available=useQuery({...artifactsOptions(task.projectId),enabled:writable}),action=useTaskAction();
 return <VStack gap={2}><Heading level={3}>연결된 아티팩트</Heading>
 {linked.isPending||linked.error?<RequestState error={linked.error} retry={()=>void linked.refetch()}/>:linked.data.map(artifact=><HStack key={artifact.id} gap={1} justify="between" align="center"><Button label={artifact.title} href={'/artifacts/'+artifact.id+(task.projectId ? '?projectId='+encodeURIComponent(task.projectId) : '?scope=personal')} variant="secondary" style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}/>{writable?<Button label="연결 해제" variant="secondary" size="sm" isDisabled={action.isPending} onClick={()=>action.mutate(()=>linkTaskArtifact(task.id,artifact.id,false))}/>:null}</HStack>)}
 {linked.data?.length===0?<Text type="supporting">연결된 아티팩트가 없습니다.</Text>:null}
 {writable?<Selector size="sm" variant="ghost" label="아티팩트 연결" isLabelHidden value="" placeholder="아티팩트 연결…" hasSearch options={(available.data??[]).filter(a=>!linked.data?.some(l=>l.id===a.id)).map(a=>({value:a.id,label:a.title}))} isDisabled={action.isPending||!linked.data||!!available.error} isLoading={available.isPending} onChange={id=>action.mutate(()=>linkTaskArtifact(task.id,id,true))}/>:null}
 {available.error||action.error?<Text role="alert">{(available.error??action.error)?.message}</Text>:null}
 </VStack>;
}
