import { foldersOptions } from '@/entities/artifact';
import { ArtifactEditor } from '@/features/edit-artifact';
import { TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { HgiEdit } from '@/shared/ui/icons';
import { BackButton } from '@/shared/ui/navigation';
import { MobilePageHeader, MOBILE_QUERY } from '@/shared/ui/mobile';
import { Button, Heading, HStack, Layout, LayoutContent, LayoutHeader, Text, VStack } from '@astryxdesign/core';
import { Markdown } from '@astryxdesign/core/Markdown';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { DocDetailProps } from './document-detail';

export function ArtifactDetailPage({ artifact, projectId, onBack }: DocDetailProps) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [editing, setEditing] = useState(false);
  const folders = useQuery(foldersOptions(projectId));
  const doc = artifact.summary;
  const folder = folders.data?.find(item => item.id === doc.folderId);
  const editButton = <Button label="편집" icon={<HgiEdit />} isIconOnly={mobile} variant="ghost" size={mobile ? 'lg' : 'sm'} onClick={() => setEditing(true)} />;
  return <>
    <Layout padding={0} height="fill" contentWidth={WIDTH.wide}
      header={mobile ? <MobilePageHeader title={doc.title} onBack={onBack} backLabel="아티팩트 목록으로" actions={editButton} /> :
        <LayoutHeader hasDivider><HStack gap={1} align="center" paddingInline={4} paddingBlockStart={TITLE_PAD_TOP} height={TITLE_ROW}>
          <BackButton label="아티팩트 목록으로" onClick={onBack} />
          <Heading level={1} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</Heading>{editButton}
        </HStack></LayoutHeader>}
      content={<LayoutContent padding={mobile ? 3 : 4}><VStack gap={4}>
        <Text type="supporting">{folder?.name ?? (doc.folderId ? '폴더' : '전체 아티팩트')} · 작성 {artifact.authorName} · 수정 {new Date(doc.updatedAt).toLocaleString('ko-KR')} · 개정 {artifact.revisionNo}</Text>
        {artifact.body ? <Markdown contentWidth="52rem">{artifact.body}</Markdown> : <Text color="secondary">아직 내용이 없습니다.</Text>}
      </VStack></LayoutContent>} />
    {editing ? <ArtifactEditor projectId={projectId} folderId={doc.folderId} artifact={artifact} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} /> : null}
  </>;
}
