import { foldersOptions, versionOptions } from '@/entities/artifact';
import { ArtifactEditor } from '@/features/edit-artifact';
import { PANEL, TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { HgiEdit, HgiViewList } from '@/shared/ui/icons';
import { BackButton } from '@/shared/ui/navigation';
import { MobilePageHeader, MobileSurface, MOBILE_QUERY } from '@/shared/ui/mobile';
import { RequestState } from '@/shared/ui/request-state';
import { Banner, Button, DialogHeader, Heading, HStack, Layout, LayoutContent, LayoutHeader, LayoutPanel, Text, VStack } from '@astryxdesign/core';
import { Markdown } from '@astryxdesign/core/Markdown';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArtifactMetadata } from './ArtifactMetadata';
import { formatArtifactDate, type DocDetailProps } from './document-detail';

export function ArtifactDetailPage({ artifact, projectId, onBack, selectedVersion, onSelectVersion }: DocDetailProps) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [editing, setEditing] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const folders = useQuery(foldersOptions(projectId));
  const history = useQuery({ ...versionOptions(projectId, artifact.summary.id, selectedVersion ?? artifact.versionNo), enabled: selectedVersion !== null });
  const doc = artifact.summary;
  const folder = folders.data?.find(item => item.id === doc.folderId);
  const folderName = !doc.folderId ? '전체 아티팩트' : folder?.name ?? (folders.error ? '폴더 정보를 불러오지 못했습니다' : folders.data ? '폴더를 찾을 수 없습니다' : '불러오는 중…');
  const historical = selectedVersion !== null;
  const title = historical ? history.data?.title ?? `v${selectedVersion}` : doc.title;
  const body = historical ? history.data?.body : artifact.body;
  const editButton = <Button label="편집" icon={<HgiEdit />} isIconOnly={mobile} variant="ghost" size={mobile ? 'lg' : 'sm'} isDisabled={historical} onClick={() => setEditing(true)} />;
  const metadata = <ArtifactMetadata artifact={artifact} projectId={projectId} folderName={folderName} selectedVersion={selectedVersion}
    onSelectVersion={version => { onSelectVersion(version === artifact.versionNo ? null : version); setInfoOpen(false); }} />;
  return <>
    <Layout padding={0} height="fill" contentWidth={WIDTH.wide}
      header={mobile ? <MobilePageHeader title={title} onBack={onBack} backLabel="아티팩트 목록으로" actions={editButton} /> :
        <LayoutHeader hasDivider><HStack gap={1} align="center" paddingInline={4} paddingBlockStart={TITLE_PAD_TOP} height={TITLE_ROW}>
          <BackButton label="아티팩트 목록으로" onClick={onBack} />
          <Heading level={1} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Heading>{editButton}
        </HStack></LayoutHeader>}
      end={mobile ? undefined : <LayoutPanel width={PANEL.meta} hasDivider padding={4} label="문서 정보와 버전 이력">{metadata}</LayoutPanel>}
      content={<LayoutContent padding={mobile ? 3 : 4}><VStack gap={4}>
        {mobile ? <HStack gap={2} justify="between" align="center">
          <Text type="supporting">v{selectedVersion ?? artifact.versionNo}</Text>
          <Button label="정보 및 이력" icon={<HgiViewList />} size="sm" onClick={() => setInfoOpen(true)} />
        </HStack> : null}
        {historical ? <Banner status="info" title={`버전 보기 · v${selectedVersion}`}
          description={history.data ? `${history.data.summary.authorName || '알 수 없는 사용자'} · ${formatArtifactDate(history.data.summary.createdAt)}` : undefined}
          endContent={<Button label="최신 문서로" size="sm" onClick={() => onSelectVersion(null)} />} /> : null}
        {historical && (!history.data || history.error) ? <RequestState error={history.error} retry={() => { void history.refetch(); }} /> :
          body ? <Markdown key={selectedVersion ?? 'latest'} contentWidth="52rem">{body}</Markdown> : <Text color="secondary">아직 내용이 없습니다.</Text>}
      </VStack></LayoutContent>} />
    {mobile && infoOpen ? <MobileSurface title="문서 정보와 버전 이력" presentation="fullscreen" purpose="info" isOpen onOpenChange={setInfoOpen}>
      <Layout padding={0} header={<DialogHeader title="문서 정보와 버전 이력" onOpenChange={setInfoOpen} />}
        content={<LayoutContent padding={4}>{metadata}</LayoutContent>} />
    </MobileSurface> : null}
    {editing ? <ArtifactEditor projectId={projectId} folderId={doc.folderId} artifact={artifact} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} /> : null}
  </>;
}
