import { Button, Text, VStack } from '@astryxdesign/core';
import { useState } from 'react';

export function NoteIdentity({id,archived}:{id:string;archived:boolean}) {
  const [message,setMessage]=useState('');
  return <VStack gap={0}>
    <Button label={'메모 ID 복사: '+id} variant="secondary" size="sm" onClick={async()=>{
      try { await navigator.clipboard.writeText(id); setMessage('ID를 복사했습니다.'); }
      catch { setMessage('복사하지 못했습니다. ID를 직접 선택해 복사해주세요.'); }
    }}>{id}{archived ? ' · 보관됨' : ''}</Button>
    {message ? <Text type="supporting" role="status">{message}</Text> : null}
  </VStack>;
}
