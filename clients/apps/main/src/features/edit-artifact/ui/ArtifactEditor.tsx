import { useWorkspaceStore } from '@/entities/workspace';
import { artifactOptions, createArtifact, editArtifact, type ArtifactView } from '@/entities/artifact';
import { LazyDocumentEditor } from '@/shared/ui/lazy-document-editor';
import { PageLayout, PageContent, PageHeader } from '@/shared/ui/page-layout';
import { WIDTH } from '@/shared/config';
import { Button, Selector, HStack, Text, TextInput, VStack, useToast } from '@astryxdesign/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import { Suspense, useRef, useState } from 'react';

export function ArtifactEditor({ projectId, folderId, artifact, onClose, onSaved }: {
  projectId: string | null; folderId: string | null; artifact?: ArtifactView; onClose: () => void; onSaved: (id: string) => void;
}) {
  const { projects } = useWorkspaceStore();
  const [destination, setDestination] = useState(projectId);
  const [title, setTitle] = useState(artifact?.summary.title ?? '');
  const [body, setBody] = useState(artifact?.body ?? '');
  const version = useRef(artifact?.versionNo);
  const leaving = useRef(false);
  const client = useQueryClient();
  const toast = useToast();
  const dirty = title !== (artifact?.summary.title ?? '') || body !== (artifact?.body ?? '');
  const canEdit = destination === null || projects.some(p => p.id === destination && !p.archived && ['owner', 'editor'].includes(p.role ?? ''));
  const mutation = useMutation({
    mutationFn: async () => {
      if (!canEdit) throw new Error('이 프로젝트에 아티팩트를 작성할 권한이 없습니다.');
      if (!artifact) return createArtifact(destination, { folderId: folderId ?? undefined, title: title.trim(), body });
      const latest = await client.fetchQuery({ ...artifactOptions(projectId, artifact.summary.id), staleTime: 0 });
      if (latest.versionNo !== version.current) throw new Error('편집 중 새 버전이 저장됐습니다. 작성한 내용을 복사한 뒤 편집기를 다시 열어 확인해 주세요.');
      await editArtifact(projectId, artifact.summary.id, { title: title.trim(), body, expectedVersion: version.current });
      return artifact.summary.id;
    },
    onSuccess: async id => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['artifacts'] }),
        client.invalidateQueries({ queryKey: ['artifact-folders'] }),
      ]);
      leaving.current = true;
      toast({ body: '아티팩트를 저장했습니다.' });
      onSaved(id);
    },
  });
  useBlocker({
    shouldBlockFn: () => !leaving.current && (mutation.isPending || (dirty && !window.confirm('저장하지 않은 변경사항을 버리고 이동할까요?'))),
    enableBeforeUnload: dirty && !leaving.current,
  });
  const close = () => {
    if (mutation.isPending || (dirty && !window.confirm('저장하지 않은 변경사항을 버릴까요?'))) return;
    leaving.current = true;
    onClose();
  };
  return <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
    header={<PageHeader title={artifact ? '아티팩트 편집' : '새 아티팩트'} onBack={close} actions={<HStack gap={2}>
      <Button label="취소" size="sm" variant="secondary" onClick={close} isDisabled={mutation.isPending} />
      <Button label="저장" size="sm" variant="primary" isDisabled={!canEdit || !title.trim() || mutation.isPending || Boolean(artifact && !dirty)} isLoading={mutation.isPending} onClick={() => mutation.mutate()} />
    </HStack>} />}
    content={<PageContent padding={4}><VStack gap={4}>
      {!artifact ? <Selector label="소속" value={destination ?? 'personal'} isDisabled={Boolean(folderId) || mutation.isPending}
        options={[{ value: 'personal', label: '개인' }, ...projects.filter(p => !p.archived && ['owner', 'editor'].includes(p.role ?? '')).map(p => ({ value: p.id, label: p.name }))]}
        onChange={value => setDestination(value === 'personal' ? null : String(value))} /> : null}
      <TextInput label="제목" aria-label="제목" isLabelHidden placeholder="아티팩트의 제목을 입력하세요" value={title} onChange={setTitle} isRequired isDisabled={mutation.isPending} />
      {mutation.error ? <Text role="alert">{mutation.error.message}</Text> : null}
      <Suspense fallback={<Text>편집기를 불러오는 중입니다.</Text>}>
        <LazyDocumentEditor initialMarkdown={artifact?.body ?? ''} onChange={value => setBody(value.markdown)} disabled={mutation.isPending || !canEdit} />
      </Suspense>
    </VStack></PageContent>} />;
}
