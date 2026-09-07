import { Button, DialogHeader, HStack, Layout, LayoutContent, LayoutFooter, Text, TextArea, TextInput, VStack } from '@astryxdesign/core';
import { useRef, useState } from 'react';
import { MobileSurface } from './MobileSurface';

export function CreateDialog({ title, onClose, onSave, withBody = true, nameLabel, bodyLabel }: {
  title: string; onClose: () => void; onSave: (title: string, body: string) => void | Promise<unknown>; withBody?: boolean; nameLabel?: string; bodyLabel?: string;
}) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const close = () => { if (!submitting.current) onClose(); };
  const save = async () => {
    if (submitting.current || !name.trim()) return;
    submitting.current = true; setPending(true); setError('');
    try { await onSave(name.trim(), body); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : '저장하지 못했습니다.'); }
    finally { submitting.current = false; setPending(false); }
  };
  return <MobileSurface title={title} presentation="fullscreen" isOpen onOpenChange={open => { if (!open) close(); }} purpose="form" width="40rem">
    <Layout header={<DialogHeader title={title} onOpenChange={close} />}
      content={<LayoutContent><VStack gap={4}>
        <TextInput label={nameLabel ?? (withBody ? '제목' : '폴더 이름')} value={name} onChange={setName} isRequired isDisabled={pending} />
        {withBody ? <TextArea label={bodyLabel ?? '내용'} value={body} onChange={setBody} rows={12} isDisabled={pending} /> : null}
        {error ? <Text role="alert">{error}</Text> : null}
      </VStack></LayoutContent>}
      footer={<LayoutFooter hasDivider><HStack gap={2} paddingBlock={3} wrap="wrap">
        <Button label="취소" size="lg" onClick={close} isDisabled={pending} />
        <Button label="저장" size="lg" variant="primary" width="100%" isDisabled={!name.trim() || pending} isLoading={pending} onClick={() => { void save(); }} />
      </HStack></LayoutFooter>} />
  </MobileSurface>;
}
