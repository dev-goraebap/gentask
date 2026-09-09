import { Button, Heading, HStack, Text, TextInput, VStack } from '@astryxdesign/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RequestState } from '@/shared/ui/request-state';
import { type Task,taskNotesOptions,linkTaskNote } from '../api/tasks';
import { useTaskAction } from '../model/useTaskAction';

export function TaskNotes({task,writable}:{task:Task;writable:boolean}) {
  const linked=useQuery(taskNotesOptions(task.id));
  const action=useTaskAction();
  const [id,setId]=useState('');
  const add=()=>{if(/^[A-Za-z0-9_-]{12}$/.test(id.trim())&&!action.isPending) action.mutate(async()=>{await linkTaskNote(task.id,id.trim(),true);setId('');});};
  return <VStack gap={2}>
    <Heading level={3}>연결된 메모</Heading>
    {linked.isPending||linked.error ? <RequestState error={linked.error} retry={()=>void linked.refetch()}/> : linked.data.map(note=><VStack key={note.id} gap={1}>
      <HStack gap={1} align="center" justify="between">
        <Button label={'메모 '+note.id+' 열기'} variant="secondary" size="sm" href={'/notes?note='+note.id+(task.projectId?'&projectId='+encodeURIComponent(task.projectId):'&scope=personal')}>{note.id}</Button>
        {writable ? <Button label={'메모 '+note.id+' 연결 해제'} size="sm" variant="secondary" isDisabled={action.isPending} onClick={()=>action.mutate(()=>linkTaskNote(task.id,note.id,false))}>해제</Button> : null}
      </HStack>
      <Text type="supporting" maxLines={2}>{note.preview || '첨부파일 메모'}</Text>
      {note.archived ? <Text type="supporting" color="secondary">보관됨</Text> : null}
    </VStack>)}
    {linked.data?.length===0 ? <Text type="supporting">연결된 메모가 없습니다.</Text> : null}
    {writable ? <>
      <HStack gap={1} align="center"><TextInput label="연결할 메모 ID" isLabelHidden placeholder="메모 ID" value={id} onChange={setId} size="sm" isDisabled={action.isPending}
        onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();add();}}}/>
      <Button label="메모 연결" size="sm" variant="secondary" isDisabled={action.isPending||!/^[A-Za-z0-9_-]{12}$/.test(id.trim())} onClick={add}>연결</Button></HStack>
      <Text type="supporting" color="secondary">{task.projectId?'같은 프로젝트에 공유한 메모를 연결합니다.':'개인 메모의 상세 화면에서 ID를 복사해 연결하세요.'}</Text>
    </> : null}
    {action.error ? <Text role="alert">{action.error.message}</Text> : null}
  </VStack>;
}
