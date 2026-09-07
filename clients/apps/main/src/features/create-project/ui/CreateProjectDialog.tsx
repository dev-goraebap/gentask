import { createProject, projectsOptions } from '@/entities/workspace';
import { MobileSurface } from '@/shared/ui/mobile';
import { Button, DialogHeader, HStack, Layout, LayoutContent, LayoutFooter, Text, TextInput, VStack } from '@astryxdesign/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function CreateProjectDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => createProject({ name: name.trim(), key: key.trim() }),
    onSuccess: async id => {
      await client.invalidateQueries({ queryKey: projectsOptions().queryKey });
      onClose(); onCreated(id);
    },
  });
  const close = () => { if (!mutation.isPending) onClose(); };
  return <MobileSurface title="프로젝트 만들기" presentation="fullscreen" isOpen onOpenChange={open => { if (!open) close(); }} purpose="form" width="32.5rem">
    <Layout header={<DialogHeader title="프로젝트 만들기" onOpenChange={close} />}
      content={<LayoutContent><VStack gap={4}>
        <TextInput label="프로젝트명" value={name} onChange={setName} isRequired hasAutoFocus isDisabled={mutation.isPending} />
        <TextInput label="프로젝트 키" description="작업 항목의 번호 앞에 표시할 키입니다. 최대 10자까지 입력할 수 있습니다." value={key} onChange={setKey} isRequired isDisabled={mutation.isPending} />
        {mutation.error ? <Text role="alert">{mutation.error.message}</Text> : null}
      </VStack></LayoutContent>}
      footer={<LayoutFooter hasDivider><HStack gap={2} justify="end" paddingBlock={3}>
        <Button label="취소" onClick={close} isDisabled={mutation.isPending} />
        <Button label="프로젝트 만들기" variant="primary" isLoading={mutation.isPending} isDisabled={!name.trim() || !key.trim() || key.trim().length > 10 || mutation.isPending} onClick={() => mutation.mutate()} />
      </HStack></LayoutFooter>} />
  </MobileSurface>;
}
