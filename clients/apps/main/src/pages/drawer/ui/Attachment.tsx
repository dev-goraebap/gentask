import { Button, Text, VStack } from '@astryxdesign/core';
import { useEffect, useState } from 'react';


export function Attachment({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  return <VStack gap={2}>
    {url && file.type.startsWith('image/') ? <img src={url} alt={file.name} style={{ width: '100%', height: 'auto' }} /> : null}
    <Button label={file.name} href={url || undefined} target="_blank" rel="noopener noreferrer" variant="ghost" width="100%"><Text style={{ overflowWrap: 'anywhere', whiteSpace: 'normal' }}>{file.name}</Text></Button>
  </VStack>;
}
