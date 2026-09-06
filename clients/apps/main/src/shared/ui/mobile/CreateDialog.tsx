import { Button, DialogHeader, HStack, Layout, LayoutContent, LayoutFooter, TextArea, TextInput, VStack } from '@astryxdesign/core';
import { useState } from 'react';
import { MobileSurface } from './MobileSurface';

export function CreateDialog({ title, onClose, onSave, withBody = true, nameLabel, bodyLabel }: {
  title: string; onClose: () => void; onSave: (title: string, body: string) => void; withBody?: boolean; nameLabel?: string; bodyLabel?: string;
}) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  return <MobileSurface title={title} presentation="fullscreen" isOpen onOpenChange={(open) => { if (!open) onClose(); }} purpose="form" width="40rem">
    <Layout header={<DialogHeader title={title} onOpenChange={onClose} />}
      content={<LayoutContent><VStack gap={4}>
        <TextInput label={nameLabel ?? (withBody ? '제목' : '폴더 이름')} value={name} onChange={setName} isRequired />
        {withBody ? <TextArea label={bodyLabel ?? "내용"} value={body} onChange={setBody} rows={12} /> : null}
      </VStack></LayoutContent>}
      footer={<LayoutFooter hasDivider><HStack gap={2} paddingBlock={3} wrap="wrap">
        <Button label="취소" size="lg" onClick={onClose} />
        <Button label="저장" size="lg" variant="primary" width="100%" isDisabled={!name.trim()} onClick={() => { onSave(name.trim(), body); onClose(); }} />
      </HStack></LayoutFooter>} />
  </MobileSurface>;
}
