import { artifactKeys, artifactOptions, createArtifact, editArtifact, type ArtifactView } from '@/entities/artifact';
import { LazyMarkdownEditor } from '@/shared/ui/markdown-editor';
import { MobileSurface } from '@/shared/ui/mobile';
import { Button, DialogHeader, HStack, Layout, LayoutContent, LayoutFooter, Text, TextInput, VStack, useToast } from '@astryxdesign/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Suspense, useRef, useState } from 'react';

export function ArtifactEditor({ projectId, folderId, artifact, onClose, onSaved }: {
  projectId: string | null; folderId: string | null; artifact?: ArtifactView; onClose: () => void; onSaved: (id: string) => void;
}) {
  const [title, setTitle] = useState(artifact?.summary.title ?? '');
  const [body, setBody] = useState(artifact?.body ?? '');
  const version = useRef(artifact?.versionNo);
  const client = useQueryClient();
  const toast = useToast();
  const label = artifact ? '아티팩트 편집' : '새 아티팩트';
  const mutation = useMutation({
    mutationFn: async () => {
      if (!artifact) return createArtifact(projectId, { folderId, title: title.trim(), body });
      const latest = await client.fetchQuery({ ...artifactOptions(projectId, artifact.summary.id), staleTime: 0 });
      if (latest.versionNo !== version.current) throw new Error('편집 중 새 버전이 저장됐습니다. 작성한 내용을 복사한 뒤 편집기를 다시 열어 확인해 주세요.');
      await editArtifact(projectId, artifact.summary.id, { title: title.trim(), body });
      return artifact.summary.id;
    },
    onSuccess: async id => {
      await Promise.all([
        client.invalidateQueries({ queryKey: artifactKeys.all(projectId) }),
        client.invalidateQueries({ queryKey: artifactKeys.folders(projectId) }),
      ]);
      toast({ body: '아티팩트를 저장했습니다.' });
      onSaved(id);
    },
  });
  const close = () => { if (!mutation.isPending) onClose(); };
  return <MobileSurface title={label} presentation="fullscreen" isOpen onOpenChange={open => { if (!open) close(); }} purpose="form" width="48rem">
    <Layout header={<DialogHeader title={label} onOpenChange={close} />}
      content={<LayoutContent><VStack gap={4}>
        <TextInput label="제목" placeholder="아티팩트의 제목을 입력하세요" value={title} onChange={setTitle} isRequired isDisabled={mutation.isPending} />
        <VStack inert={mutation.isPending}><Suspense fallback={<Text>편집기를 불러오는 중입니다.</Text>}><LazyMarkdownEditor value={body} onChange={setBody} /></Suspense></VStack>
        {mutation.error ? <Text role="alert">{mutation.error.message}</Text> : null}
      </VStack></LayoutContent>}
      footer={<LayoutFooter hasDivider><HStack gap={2} justify="end" paddingBlock={3}>
        <Button label="취소" onClick={close} isDisabled={mutation.isPending} />
        <Button label="저장" variant="primary" isDisabled={!title.trim() || mutation.isPending} isLoading={mutation.isPending} onClick={() => mutation.mutate()} />
      </HStack></LayoutFooter>} />
  </MobileSurface>;
}
