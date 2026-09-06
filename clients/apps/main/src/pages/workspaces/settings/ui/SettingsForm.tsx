import { FilePicker } from '@/shared/ui/file-picker';
import { ME } from '@/entities/session';
import { ProjectAvatar, useWorkspaceStore, type Project } from '@/entities/workspace';
import { WIDTH } from '@/shared/config';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { AlertDialog, Button, Heading, HStack, Layout, LayoutContent, LayoutFooter, LayoutHeader, Text, TextArea, TextInput, useToast, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useDeleteWorkspace } from '../model/useDeleteWorkspace';


export function SettingsForm({ project }: { project: Project }) {
  const { members, updateProject } = useWorkspaceStore();
  const deleteProject = useDeleteWorkspace();
  const navigate = useNavigate();
  const toast = useToast();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [image, setImage] = useState(project.image);
  const [confirm, setConfirm] = useState<'archive' | 'delete' | null>(null);
  const canManage = members.some((m) => m.projectId === project.id && m.name === ME && m.role === 'owner');
  const dirty = name.trim() !== project.name || description !== (project.description ?? '') || image !== project.image;
  return <>
    <Layout contentWidth={WIDTH.narrow}
      header={!mobile ? <LayoutHeader hasDivider padding={mobile ? 0 : undefined}><VStack padding={4} gap={2}><Heading level={1}>프로젝트 설정</Heading><Text color="secondary">프로젝트 정보와 보관 상태를 관리합니다.</Text></VStack></LayoutHeader> : undefined}
      footer={<LayoutFooter hasDivider><HStack padding={4} justify="end"><Button label="변경사항 저장" variant="primary" size={mobile ? 'lg' : 'sm'} width={mobile ? '100%' : undefined}
        isDisabled={!canManage || !name.trim() || !dirty} onClick={() => { updateProject(project.id, { name: name.trim(), description, image }); toast({ body: '프로젝트 정보를 저장했습니다.' }); }} /></HStack></LayoutFooter>}
      content={<LayoutContent padding={mobile ? 3 : 4}><VStack gap={6}>
        {!canManage ? <Text>프로젝트 소유자만 설정을 변경할 수 있습니다.</Text> : null}
        <VStack gap={3}><ProjectAvatar project={{ name, image }} size="lg" />
          <FilePicker label="프로젝트 이미지" accept="image/png,image/jpeg,image/webp,image/gif" value={image ? [image] : []} disabled={!canManage} onChange={files => setImage(files[0])} />
          {image ? <Button label="기본 이미지 사용" variant="ghost" isDisabled={!canManage} onClick={() => setImage(undefined)} /> : null}
        </VStack>
        <VStack gap={4}><TextInput label="프로젝트 이름" value={name} onChange={setName} isRequired isDisabled={!canManage} />
          <TextArea label="설명" value={description} onChange={setDescription} rows={3} isDisabled={!canManage} /></VStack>
        <VStack gap={3}><Heading level={2}>{project.archived ? '프로젝트 복원' : '프로젝트 보관'}</Heading>
          <Text color="secondary">보관한 프로젝트는 진행 중 목록에서 제외됩니다. 데이터는 유지되며 복원할 수 있습니다.</Text>
          <Button label={project.archived ? '프로젝트 복원' : '프로젝트 보관'} isDisabled={!canManage} onClick={() => {
            if (project.archived) { updateProject(project.id, { archived: false }); toast({ body: '프로젝트를 복원했습니다.' }); }
            else setConfirm('archive');
          }} /></VStack>
        <VStack gap={3}><Heading level={2}>프로젝트 삭제</Heading><Text color="secondary">프로젝트와 소속 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.</Text>
          <Button label="프로젝트 삭제" variant="destructive" isDisabled={!canManage} onClick={() => setConfirm('delete')} /></VStack>
      </VStack></LayoutContent>} />
    <AlertDialog isOpen={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null); }}
      title={confirm === 'delete' ? '프로젝트를 삭제하시겠습니까?' : '프로젝트를 보관하시겠습니까?'}
      description={confirm === 'delete' ? `${project.name} 프로젝트와 소속 데이터를 삭제합니다. 되돌릴 수 없습니다.` : `${project.name} 프로젝트를 진행 중 목록에서 제외합니다. 나중에 복원할 수 있습니다.`}
      actionLabel={confirm === 'delete' ? '삭제' : '보관'} cancelLabel="취소" actionVariant={confirm === 'delete' ? 'destructive' : 'primary'} onAction={() => {
        if (!canManage) return;
        if (confirm === 'delete') deleteProject(project.id); else updateProject(project.id, { archived: true });
        setConfirm(null);
        navigate({ to: '/projects' });
      }} />
  </>;
}
