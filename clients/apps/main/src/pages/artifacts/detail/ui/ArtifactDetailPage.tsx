import { useWorkspaceStore } from '@/entities/workspace';
import { PageLayout, PageContent } from '@/shared/ui/page-layout';
import { versionOptions } from '@/entities/artifact';
import { ArtifactEditor } from '@/features/edit-artifact';
import { TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { AppAsideContent, useAppAside } from '@/shared/ui/app-aside';
import { HgiComment, HgiEdit, HgiHistory } from '@/shared/ui/icons';
import { BackButton } from '@/shared/ui/navigation';
import { MobilePageHeader, MOBILE_QUERY } from '@/shared/ui/mobile';
import { RequestState } from '@/shared/ui/request-state';
import { Banner, Button, Heading, HStack, LayoutContent, LayoutHeader, Text, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArtifactHistory } from './ArtifactHistory';
import { ArtifactComments } from './ArtifactComments';
import { formatArtifactDate, type DocDetailProps } from './document-detail';

export function ArtifactDetailPage({ artifact, projectId, onBack, selectedVersion, onSelectVersion }: DocDetailProps) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const { projects } = useWorkspaceStore();
  const canEdit = projectId === null || ['owner', 'editor'].includes(projects.find(p => p.id === projectId)?.role ?? '');
  const [editing, setEditing] = useState(false);
  const aside = useAppAside();
  const historyKey = `artifact-history:${artifact.summary.id}`;
  const commentsKey = `artifact-comments:${artifact.summary.id}`;
  const history = useQuery({ ...versionOptions(projectId, artifact.summary.id, selectedVersion ?? artifact.versionNo), enabled: selectedVersion !== null });
  const doc = artifact.summary;
  const historical = selectedVersion !== null;
  const title = historical ? history.data?.title ?? `v${selectedVersion}` : doc.title;
  const body = historical ? history.data?.body : artifact.body;
  const editButton = <Button label="편집" icon={<HgiEdit />} isIconOnly={mobile} variant="ghost" size="sm" isDisabled={historical} onClick={() => setEditing(true)} />;
  const actions = <HStack gap={1} align="center">
    <Button label="버전 이력" tooltip="버전 이력" icon={<HgiHistory />} isIconOnly variant="ghost" size="sm" aria-pressed={aside.active?.key === historyKey} onClick={() => aside.open({ key: historyKey, title: '버전 이력' })} />
    <Button label="코멘트" icon={<HgiComment />} variant="ghost" size="sm" aria-pressed={aside.active?.key === commentsKey} onClick={() => aside.open({ key: commentsKey, title: '코멘트' })} />
    {canEdit ? editButton : null}</HStack>;
  const versionHistory = <ArtifactHistory artifactId={doc.id} latestVersion={artifact.versionNo} projectId={projectId} selectedVersion={selectedVersion}
    onSelect={version => onSelectVersion(version === artifact.versionNo ? null : version)} />;
  return <>
    <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
      header={mobile ? <MobilePageHeader title={title} onBack={onBack} backLabel="아티팩트 목록으로" /> :
        <LayoutHeader hasDivider><HStack gap={1} align="center" paddingInline={4} paddingBlockStart={TITLE_PAD_TOP} height={TITLE_ROW}>
          <BackButton label="아티팩트 목록으로" onClick={onBack} />
          <Heading level={1} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Heading>{actions}
        </HStack></LayoutHeader>}
      content={<PageContent padding={mobile ? 3 : 4}><VStack gap={4}>
        <HStack gap={2} justify="between" align="center" wrap="wrap">
          <HStack gap={2} align="center" wrap="wrap"><Text type="supporting">{doc.id}</Text><Text type="supporting">· v{selectedVersion ?? artifact.versionNo}</Text></HStack>
          {mobile ? actions : null}
        </HStack>
        {historical ? <Banner status="info" title={`버전 보기 · v${selectedVersion}`}
          description={history.data ? `${history.data.summary.authorName || '알 수 없는 사용자'} · ${formatArtifactDate(history.data.summary.createdAt)}` : undefined}
          endContent={<Button label="최신 문서로" size="sm" onClick={() => onSelectVersion(null)} />} /> : null}
        {historical && (!history.data || history.error) ? <RequestState error={history.error} retry={() => { void history.refetch(); }} /> :
          <ArtifactComments key={`${doc.id}:${selectedVersion ?? artifact.versionNo}`} panelKey={commentsKey} projectId={projectId} artifactId={doc.id} versionNo={selectedVersion ?? artifact.versionNo} body={body ?? ''} writable={(selectedVersion ?? artifact.versionNo) === artifact.versionNo} />}
      </VStack></PageContent>} />
    <AppAsideContent panelKey={historyKey}><LayoutContent padding={3}>{versionHistory}</LayoutContent></AppAsideContent>
    {editing && canEdit ? <ArtifactEditor projectId={projectId} folderId={doc.folderId} artifact={artifact} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} /> : null}
  </>;
}
