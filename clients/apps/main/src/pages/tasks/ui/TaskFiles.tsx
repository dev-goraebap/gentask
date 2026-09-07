import {taskFilesOptions,uploadTaskFile,removeTaskFile} from '../api/tasks';
import {useQuery} from '@tanstack/react-query';
import {Button,Heading,Text,VStack,HStack,FileInput} from '@astryxdesign/core';
import {useTaskAction} from '../model/useTaskAction';
import {RequestState} from '@/shared/ui/request-state';
export function TaskFiles({taskId,writable}:{taskId:string;writable:boolean}){
 const query=useQuery(taskFilesOptions(taskId)),action=useTaskAction();
 return <VStack gap={2}><Heading level={3}>첨부파일</Heading>
 {query.isPending||query.error?<RequestState error={query.error} retry={()=>void query.refetch()}/>:query.data.map(file=><HStack key={file.id} gap={1} justify="between" align="center"><VStack style={{minWidth:0}}><Button label={file.fileName} href={file.url} target="_blank" variant="ghost"/><Text type="supporting">{Math.ceil(file.size/1024)} KB</Text></VStack>{writable?<Button label="삭제" variant="ghost" size="sm" isDisabled={action.isPending} onClick={()=>{if(window.confirm(file.fileName+' 파일을 삭제할까요?'))action.mutate(()=>removeTaskFile(taskId,file.id));}}/>:null}</HStack>)}
 {query.data?.length===0?<Text type="supporting">첨부파일이 없습니다.</Text>:null}
 {writable?<FileInput label="파일 첨부" value={null} onChange={file=>{if(file&&!Array.isArray(file))action.mutate(()=>uploadTaskFile(taskId,file));}} maxSize={10*1024*1024} description="최대 5개 · 파일당 10 MB" isDisabled={action.isPending||!query.data||query.data.length>=5} isLoading={action.isPending}/>:null}
 {action.error?<Text role="alert">{action.error.message}</Text>:null}
 </VStack>;
}
