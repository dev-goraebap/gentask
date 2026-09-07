import { PageLayout, PageContent } from '@/shared/ui/page-layout';
import { MobileFilterBar, MobileFilterButton, MobileSurface } from '@/shared/ui/mobile';
import { ListingFooter, SortSelector, SortFields, type SortValue, type SortOption, useListing } from '@/shared/ui/listing';
import { MobilePageHeader } from '@/shared/ui/mobile';
import { ProjectAvatar } from '@/entities/workspace';
import { CreateProjectDialog } from '@/features/create-project';
import { useProjectList } from '@/features/project-list';
import { TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { HgiSearch } from '@/shared/ui/icons';
import { CreateButton } from '@/shared/ui/mobile';
import { Button, CheckboxList, CheckboxListItem, DialogHeader, MultiSelector, EmptyState, Heading, HStack, Item, Layout, LayoutContent, LayoutHeader, List, Selector, Text, TextInput, Token, Toolbar, VStack } from '@astryxdesign/core';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';



const statusOptions = [{ value: 'active', label: '진행 중' }, { value: 'archived', label: '보관됨' }];
const sortOptions: SortOption[] = [{ value: 'manual', label: '지정한 순서', hasDirection: false }, { value: 'name', label: '이름 순' }];

export function WorkspacesPage() {

  const { projects } = useProjectList();
  const navigate = useNavigate();
  const search = useSearch({ from: '/projects' });
  const [status, setStatus] = useState<string[]>(['active']);
  const sort: SortValue = { key: search.sort, direction: search.direction };
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ status, sort });
  const [creating, setCreating] = useState(false);
  const listing = useListing('projects', '', {
    value: { query: search.q, sort: search.sort, direction: search.direction, page: search.page, size: search.size },
    onChange: state => { void navigate({ to: '/projects', replace: state.query !== search.q,
      search: { q: state.query, sort: state.sort, direction: state.direction, page: state.page, size: state.size } }); },
  });
  const query = listing.query;
  const setQuery = (query: string) => listing.change({ query });
  const setSort = (value: SortValue) => listing.change({ sort: value.key, direction: value.direction });
  const { mobile } = listing;
  const matched = projects.filter((p) => p.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
    (!status.length || status.includes(p.archived ? 'archived' : 'active')));
  if (sort.key === 'name') matched.sort((a, b) => (sort.direction === 'asc' ? 1 : -1) * a.name.localeCompare(b.name, 'ko'));
  const visible = matched.slice(listing.range(matched.length).start, listing.range(matched.length).end);
  return <>
    <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide} header={<>
      {mobile ? <><MobilePageHeader title="프로젝트" /><CreateButton label="프로젝트 만들기" onClick={() => setCreating(true)} /></> : <LayoutHeader hasDivider padding={mobile ? 0 : undefined}><VStack gap={2}>
        <HStack justify="between" align="center" width="100%" height={mobile ? undefined : TITLE_ROW} paddingBlock={mobile ? 2 : undefined} paddingBlockStart={mobile ? 2 : TITLE_PAD_TOP} paddingInline={mobile ? 3 : 4} gap={3}>
          <Heading level={1}>프로젝트</Heading>{mobile ? <CreateButton label="프로젝트 만들기" onClick={() => setCreating(true)} /> : null}
        </HStack>
        {!mobile ? <VStack paddingInline={mobile ? 3 : 4}><Text color="secondary">참여 중인 프로젝트를 확인하고 관리합니다.</Text></VStack> : null}
      </VStack></LayoutHeader>}
      {mobile ? <MobileFilterBar label="프로젝트 필터" searchLabel="프로젝트 검색" placeholder="프로젝트 이름으로 검색" query={query} onQueryChange={setQuery}
        actions={<MobileFilterButton active={status.length > 0} onClick={() => { setDraft({ status, sort }); setFiltersOpen(true); }} />} /> :
        <Toolbar className="page-filter-toolbar" label="프로젝트 필터" size="sm" startContent={<>
          <TextInput label="프로젝트 검색" isLabelHidden placeholder="프로젝트 이름으로 검색" value={query} onChange={setQuery} startIcon={<HgiSearch />} hasClear width="13.75rem" />
          <MultiSelector label="프로젝트 상태" isLabelHidden placeholder="모든 상태" value={status} onChange={setStatus} options={statusOptions} triggerDisplay="count" formatValue={items => `상태 · ${items.length}`} hasSelectAll selectAllLabel="전체 선택" />
          {query || status.length ? <Button label="초기화" variant="ghost" onClick={() => { setQuery(''); setStatus([]); }} /> : null}
        </>} endContent={<SortSelector options={sortOptions} value={sort} onChange={setSort} />} />}

    </>} footer={mobile ? undefined : <ListingFooter {...listing.pagination(matched.length)} />} content={<PageContent ref={listing.ref} onScroll={listing.onScroll} padding={mobile ? 3 : 4} style={mobile ? { paddingBottom: 'calc(var(--spacing-10) + var(--spacing-10))' } : undefined}>
      {visible.length ? <List hasDividers style={{ marginInline: mobile ? 'calc(-1 * var(--spacing-3))' : 'calc(-1 * var(--spacing-2))' }}>{visible.map((p) => <Item as="li" key={p.id} label={p.name} labelLines={2} density={mobile ? 'spacious' : 'balanced'}
        startContent={<ProjectAvatar project={p} size="md" />}
        description={`프로젝트 키 · ${p.prefix}`}
        endContent={p.archived ? <Token label="보관됨" /> : undefined}
        onClick={() => navigate({ to: p.archived ? '/projects/$projectId/settings' : '/projects/$projectId/tasks', params: { projectId: p.id }, search: {} })} />)}</List> :
        <EmptyState title={!projects.length ? '참여 중인 프로젝트가 없습니다' : '표시할 프로젝트가 없습니다'}
          description={!projects.length ? '첫 프로젝트를 만들어 함께 작업할 공간을 마련하세요.' : '검색어나 프로젝트 상태를 바꿔 보세요.'}
          actions={!projects.length ? <Button label="첫 프로젝트 만들기" onClick={() => setCreating(true)} /> : <Button label="전체 프로젝트 보기" onClick={() => { setQuery(''); setStatus([]); }} />} />}
      {mobile ? <ListingFooter {...listing.pagination(matched.length)} /> : null}
    </PageContent>} />
    <MobileSurface title="프로젝트 필터" isOpen={filtersOpen} onOpenChange={setFiltersOpen}>
      <Layout header={<DialogHeader title="프로젝트 필터" onOpenChange={setFiltersOpen} />} content={<LayoutContent><VStack gap={4}>
        <CheckboxList label="상태" description="선택하지 않으면 모든 상태를 표시합니다." value={draft.status} onChange={status => setDraft({ ...draft, status })}>
          {statusOptions.map(option => <CheckboxListItem key={option.value} value={option.value} label={option.label} />)}
        </CheckboxList>
        <SortFields options={sortOptions} value={draft.sort} onChange={sort => setDraft({ ...draft, sort })} />
        <Button label="초기화" onClick={() => setDraft({ status: [], sort: { key: 'manual', direction: 'asc' } })} />
        <Button label="적용" variant="primary" size="lg" onClick={() => { setStatus(draft.status); setSort(draft.sort); setFiltersOpen(false); }} />
      </VStack></LayoutContent>} />
    </MobileSurface>
    {creating ? <CreateProjectDialog onClose={() => setCreating(false)} onCreated={(id) => {
      navigate({ to: '/projects/$projectId/tasks', params: { projectId: id }, search: {} });
    }} /> : null}
  </>;
}
