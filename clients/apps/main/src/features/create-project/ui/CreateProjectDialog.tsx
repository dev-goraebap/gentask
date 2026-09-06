import { FilePicker } from '@/shared/ui/file-picker';
import { ME } from '@/entities/session';
import { ProjectAvatar, useWorkspaceStore } from '@/entities/workspace';
import { MobileSurface } from '@/shared/ui/mobile';
import { Button, DialogHeader, HStack, Layout, LayoutContent, LayoutFooter, Text, TextArea, TextInput, VStack } from '@astryxdesign/core';
import { useState } from 'react';

export function CreateProjectDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { createProject } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File>();
  return <MobileSurface title="프로젝트 만들기" presentation="fullscreen" isOpen onOpenChange={open => { if (!open) onClose(); }} purpose="form" width={520}>
    <Layout header={<DialogHeader title="프로젝트 만들기" onOpenChange={onClose} />}
      content={<LayoutContent><VStack gap={4}>
        <HStack gap={3} align="center"><ProjectAvatar project={{ name, image }} size="lg" /><Text color="secondary">이미지를 선택하지 않으면 기본 아바타를 사용합니다.</Text></HStack>
        <FilePicker label="프로젝트 이미지 (선택)" accept="image/png,image/jpeg,image/webp,image/gif" value={image ? [image] : []} onChange={files => setImage(files[0])} />
        {image ? <Button label="기본 이미지 사용" variant="ghost" onClick={() => setImage(undefined)} /> : null}
        <TextInput label="프로젝트명" value={name} onChange={setName} isRequired hasAutoFocus />
        <TextArea label="간단한 설명 (선택)" value={description} onChange={setDescription} rows={3} />
      </VStack></LayoutContent>}
      footer={<LayoutFooter hasDivider><HStack gap={2} justify="end" paddingBlock={3}>
        <Button label="취소" onClick={onClose} /><Button label="프로젝트 만들기" variant="primary" isDisabled={!name.trim()} onClick={() => {
          const id = createProject(name.trim(), description.trim(), ME, image); onClose(); onCreated(id);
        }} />
      </HStack></LayoutFooter>} />
  </MobileSurface>;
}
