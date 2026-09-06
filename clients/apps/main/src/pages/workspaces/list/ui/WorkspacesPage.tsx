import { MobilePageHeader } from '@/shared/ui/mobile';
import { ProjectAvatar, useWorkspaceStore } from '@/entities/workspace';
import { CreateProjectDialog } from '@/features/create-project';
import { useProjectList } from '@/features/project-list';
import { TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { HgiSearch } from '@/shared/ui/icons';
import { CreateButton, MOBILE_QUERY } from '@/shared/ui/mobile';
import { Button, EmptyState, Heading, HStack, Item, Layout, LayoutContent, LayoutHeader, List, Selector, Text, TextInput, Token, Toolbar, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';



export function WorkspacesPage() {
  const { members } = useWorkspaceStore();
  const { projects } = useProjectList();
  const navigate = useNavigate();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('active');
  const [creating, setCreating] = useState(false);
  const visible = projects.filter((p) => p.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
    (status === 'all' || Boolean(p.archived) === (status === 'archived')));
  return <>
    <Layout padding={0} height="fill" contentWidth={WIDTH.wide} header={<>
      {mobile ? <><MobilePageHeader title="프로젝트" /><CreateButton label="프로젝트 만들기" onClick={() => setCreating(true)} /></> : <LayoutHeader hasDivider padding={mobile ? 0 : undefined}><VStack gap={2}>
        <HStack justify="between" align="center" width="100%" height={mobile ? undefined : TITLE_ROW} paddingBlock={mobile ? 2 : undefined} paddingBlockStart={mobile ? 2 : TITLE_PAD_TOP} paddingInline={mobile ? 3 : 4} gap={3}>
          <Heading level={1}>프로젝트</Heading>{mobile ? <CreateButton label="프로젝트 만들기" onClick={() => setCreating(true)} /> : null}
        </HStack>
        {!mobile ? <VStack paddingInline={mobile ? 3 : 4}><Text color="secondary">참여 중인 프로젝트를 확인하고 관리합니다.</Text></VStack> : null}
      </VStack></LayoutHeader>}
      <Toolbar className={mobile ? undefined : "page-filter-toolbar"} label="프로젝트 필터" size={mobile ? 'lg' : 'sm'} startContent={
          <TextInput label="프로젝트 검색" isLabelHidden placeholder="프로젝트 이름으로 검색" value={query} onChange={setQuery} startIcon={<HgiSearch />} hasClear width={mobile ? 'min(calc(100vw - 170px), 740px)' : 220} />
        } endContent={
          <Selector label="프로젝트 상태" isLabelHidden value={status} onChange={setStatus} options={[{ value: 'active', label: '진행 중' }, { value: 'archived', label: '보관됨' }, { value: 'all', label: '전체' }]} />
        } />
    </>} content={<LayoutContent padding={mobile ? 3 : 4} style={mobile ? { paddingBottom: 'calc(var(--spacing-10) + var(--spacing-10))' } : undefined}>
      {visible.length ? <List hasDividers style={{ marginInline: mobile ? 'calc(-1 * var(--spacing-3))' : 'calc(-1 * var(--spacing-2))' }}>{visible.map((p) => <Item as="li" key={p.id} label={p.name} labelLines={2} density={mobile ? 'spacious' : 'balanced'}
        startContent={<ProjectAvatar project={p} size="md" />}
        description={`${members.filter((m) => m.projectId === p.id).length}명 참여${p.description ? ` · ${p.description}` : ''}`}
        endContent={p.archived ? <Token label="보관됨" /> : undefined}
        onClick={() => navigate({ to: p.archived ? '/projects/$projectId/settings' : '/projects/$projectId/issues', params: { projectId: p.id }, search: {} })} />)}</List> :
        <EmptyState title={!projects.length ? '참여 중인 프로젝트가 없습니다' : '표시할 프로젝트가 없습니다'}
          description={!projects.length ? '첫 프로젝트를 만들어 함께 작업할 공간을 마련하세요.' : '검색어나 프로젝트 상태를 바꿔 보세요.'}
          actions={!projects.length ? <Button label="첫 프로젝트 만들기" onClick={() => setCreating(true)} /> : <Button label="전체 프로젝트 보기" onClick={() => { setQuery(''); setStatus('all'); }} />} />}
    </LayoutContent>} />
    {creating ? <CreateProjectDialog onClose={() => setCreating(false)} onCreated={(id) => {
      navigate({ to: '/projects/$projectId/issues', params: { projectId: id }, search: {} });
    }} /> : null}
  </>;
}
