import { Button, HStack, Text, TextInput, VStack } from '@astryxdesign/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { setNoteTags } from '../api/notes';

export function NoteTags({id,tags=[],writable}:{id:string;tags:string[];writable:boolean}) {
  const [draft,setDraft]=useState('');
  const client=useQueryClient();
  const action=useMutation({mutationFn:(values:string[])=>setNoteTags(id,values),onSuccess:async()=>{
    setDraft(''); await client.invalidateQueries({queryKey:['notes']});
  }});
  const add=()=>{const tag=draft.trim();if(tag && tags.length<10 && !tags.includes(tag) && !action.isPending) action.mutate([...tags,tag]);};
  return <VStack gap={2}>
    <HStack gap={1} wrap="wrap">
      {tags.map(tag=>writable ? <Button key={tag} label={tag+' 태그 삭제'} variant="secondary" size="sm" isDisabled={action.isPending} onClick={()=>action.mutate(tags.filter(value=>value!==tag))}>#{tag} ×</Button> : <Text key={tag} type="supporting">#{tag}</Text>)}
    </HStack>
    {writable ? <HStack gap={1} align="center">
      <TextInput label="태그 추가" isLabelHidden placeholder={tags.length>=10?'태그는 최대 10개':'태그 추가'} size="sm" value={draft} onChange={value=>setDraft(value.slice(0,40))} isDisabled={action.isPending||tags.length>=10}
        onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();add();}}}/>
      <Button label="태그 추가" size="sm" variant="secondary" isDisabled={action.isPending||!draft.trim()||tags.includes(draft.trim())||tags.length>=10} onClick={add}>추가</Button>
    </HStack> : null}
    {action.error ? <Text role="alert">{action.error.message}</Text> : null}
  </VStack>;
}
