import { FilterIndicator } from '@/shared/ui/listing';
import { PageState as EmptyState } from '@/shared/ui/page-state';
import { useWorkspaceStore } from '@/entities/workspace';
import { PageLayout, PageContent, PageHeader } from '@/shared/ui/page-layout';
import { MobileFilterBar, MobileFilterButton } from '@/shared/ui/mobile';
import { artifactKeys, artifactsOptions, foldersOptions, createFolder } from '@/entities/artifact';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RequestState } from '@/shared/ui/request-state';
import { WIDTH } from '@/shared/config';
import { HgiFile, HgiFolder, HgiPlus, HgiSearch, HgiSearchEmpty } from '@/shared/ui/icons';
import { ListingFooter, PageSize, SortSelector, SortFields, type SortOption, parseListingSearch, useListing } from '@/shared/ui/listing';
import { CreateButton, CreateDialog, MobileSurface } from '@/shared/ui/mobile';
import {
    BottomSheet,
    BreadcrumbItem,
    Breadcrumbs,
    Button,
    DialogHeader,
    Heading,
    HStack,
    ListItem,
    Layout,
    LayoutContent,
    List,
    Text,
    TextInput,
    Toolbar,
    VStack
} from '@astryxdesign/core';
import { useState } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { ArtifactEditor } from '@/features/edit-artifact';

import { SORT_LABEL, type DocSort, type DocsProps } from './documents';

const sortOptions: SortOption[] = Object.entries(SORT_LABEL).map(([value, label]) => ({ value, label, defaultDirection: value === 'updated' ? 'desc' : 'asc' }));

export function ArtifactsPage({ onOpen, folderId, onFolderChange, projectId, personal = true }: DocsProps) {
  const { projects } = useWorkspaceStore();

  const rawSearch = useSearch({ strict: false });
  const search = parseListingSearch(rawSearch, ['title', 'updated'], 'title');
  const navigate = useNavigate();
  const listing = useListing(`artifacts:${projectId}:${folderId ?? ''}`, '', {
    value: { query: search.q, sort: search.sort, direction: search.direction, page: search.page, size: search.size },
    onChange: state => { void navigate({ to: '/artifacts' as const, replace: state.query !== search.q,
      search: { projectId: projectId ?? undefined, scope: personal && !projectId ? "personal" : undefined, folder: folderId ?? undefined, q: state.query, sort: state.sort, direction: state.direction, page: state.page, size: state.size } }); },
  });
  const { query, mobile } = listing;
  const sort = listing.sort as DocSort;
  const setQuery = (query: string) => listing.change({ query });
  const direction = listing.direction;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ sort, direction, filter: listing.filter, size: listing.size });
  const [createMenu, setCreateMenu] = useState(false);
  const [creating, setCreating] = useState<'doc' | 'folder' | null>(null);
  const client = useQueryClient();
  const artifacts = useQuery(artifactsOptions(projectId, personal));
  const folderQuery = useQuery(foldersOptions(projectId, personal));
  const artifactList = artifacts.data ?? [];
  const destination = folderQuery.data?.find(f => f.id === folderId)?.projectId ?? projectId;
  const folderList = (folderQuery.data ?? []).map(folder => ({ ...folder, title: folder.name }));
  const canEdit = destination === null || ['owner', 'editor'].includes(projects.find(p => p.id === destination)?.role ?? '');
  const folderMutation = useMutation({
    mutationFn: (name: string) => createFolder(destination, { name, parentId: folderId }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['artifact-folders'] });
    },
  });


  const matched = artifactList.filter(d => d.folderId === folderId &&
    d.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => (direction === 'asc' ? 1 : -1) * (sort === 'title' ? a.title.localeCompare(b.title, 'ko') :
      (a.updatedAt ?? '').localeCompare(b.updatedAt ?? '')) || a.id.localeCompare(b.id));

  const folders = folderList.filter((f) => f.parentId === folderId &&
    f.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => (sort === 'title' && direction === 'desc' ? -1 : 1) * a.title.localeCompare(b.title, 'ko'));
  const currentFolder = folderList.find((f) => f.id === folderId);
  const entries = [
    ...folders.map((folder) => ({ kind: 'folder' as const, folder })),
    ...matched.map((doc) => ({ kind: 'doc' as const, doc })),
  ];
  const visible = entries.slice(listing.range(entries.length).start, listing.range(entries.length).end);
  const ancestors = [];
  let ancestor = currentFolder;
  while (ancestor) {
    ancestors.unshift(ancestor);
    ancestor = folderList.find((f) => f.id === ancestor?.parentId);
  }
  const isFiltered = Boolean(query);

  const reset = () => {
    setQuery('');
  };

  return (
    <>
    {artifacts.isRefetchError || folderQuery.isRefetchError ? <RequestState error={artifacts.error ?? folderQuery.error} retry={() => { void artifacts.refetch(); void folderQuery.refetch(); }} /> : null}
    <PageLayout
      padding={0}
      height="fill"
      contentWidth={WIDTH.wide}
      header={<PageHeader title="아티팩트" compact={mobile}
        actions={canEdit ? mobile ? <CreateButton label="새로 만들기" onClick={() => setCreateMenu(true)} /> : <><Button label="새 폴더" variant="secondary" size="sm" icon={<HgiFolder />} onClick={() => setCreating('folder')} /><CreateButton label="새 아티팩트" onClick={() => setCreating('doc')} /></> : undefined}
        toolbar={mobile ? <MobileFilterBar leadingContent={<FilterIndicator />} label="아티팩트 필터" searchLabel="아티팩트 검색" placeholder="제목으로 검색" query={query} onQueryChange={setQuery}
            actions={<MobileFilterButton active={false} onClick={() => { setDraft({ sort, direction, filter: listing.filter, size: listing.size }); setFiltersOpen(true); }} />} /> : <Toolbar className="page-filter-toolbar"
              label="아티팩트 필터"
              size="sm"
              startContent={
                <>
                  <FilterIndicator />

                  <TextInput
                    label="검색"
                    isLabelHidden
                    placeholder="제목으로 검색"
                    value={query}
                    onChange={setQuery}
                    startIcon={<HgiSearch />}
                    hasClear
                    width="13.75rem"
                    size="sm"
                  />

                  {isFiltered ? <Button label="초기화" variant="secondary" onClick={reset} /> : null}
                </>
              }
              endContent={
                <>
                  <SortSelector options={sortOptions} value={{ key: sort, direction }} onChange={value => listing.change({ sort: value.key, direction: value.direction })} />

                </>
              }
            />}
      />}
      footer={mobile ? undefined : <ListingFooter {...listing.pagination(entries.length)} />}
    >
      <PageContent padding={mobile ? 3 : 4} style={mobile ? { paddingBottom: 'calc(var(--spacing-12) + var(--spacing-4) * 2 + env(safe-area-inset-bottom))' } : undefined} ref={listing.ref} onScroll={listing.onScroll}>
        <VStack gap={4}>
          {!artifacts.data || !folderQuery.data ? <RequestState error={artifacts.error ?? folderQuery.error} retry={() => { void artifacts.refetch(); void folderQuery.refetch(); }} /> : <>
          <HStack justify="between" align="center" gap={2} wrap="wrap" padding={0}>
          <Breadcrumbs label="아티팩트 폴더 경로">
            <BreadcrumbItem isCurrent={!folderId} onClick={() => onFolderChange(null)}>전체 아티팩트</BreadcrumbItem>
            {ancestors.map((folder) => <BreadcrumbItem key={folder.id} isCurrent={folder.id === folderId}
              onClick={() => onFolderChange(folder.id)}>{folder.title}</BreadcrumbItem>)}
          </Breadcrumbs>
            {currentFolder ? <Button label="상위 폴더로" variant="secondary" size="sm"
              onClick={() => onFolderChange(currentFolder.parentId)} /> : null}
          </HStack>
          {folderId && !currentFolder ? <EmptyState kind="not-found" title="폴더를 찾을 수 없습니다"
            actions={<Button label="전체 아티팩트로" onClick={() => onFolderChange(null)} />} /> : <>
            {folders.length || matched.length ? <List hasDividers density={mobile ? 'spacious' : 'balanced'} style={{ marginInline: mobile ? 'calc(-1 * var(--spacing-3))' : 'calc(-1 * var(--spacing-2))' }}>
              {visible.map((entry) => entry.kind === 'folder' ?
                <ListItem key={entry.folder.id} label={entry.folder.title}
                  startContent={<HgiFolder size={16} />} onClick={() => onFolderChange(entry.folder.id)} description={"폴더 · " + (entry.folder.projectId ? projects.find(p => p.id === entry.folder.projectId)?.name ?? "프로젝트" : "개인")} /> :
                <ListItem key={entry.doc.id} label={<Text type="inherit" maxLines={mobile ? 2 : 1}>{entry.doc.title}</Text>}
                  startContent={<HgiFile size={15} />} onClick={() => onOpen(entry.doc.id)}
                  description={`${entry.doc.projectId ? projects.find(p => p.id === entry.doc.projectId)?.name ?? "프로젝트" : "개인"} · 수정 ${new Date(entry.doc.updatedAt).toLocaleString('ko-KR')}`} />)}
            </List> : <EmptyState kind={isFiltered ? 'search' : 'empty'}
              title={isFiltered ? '조건에 맞는 항목이 없습니다' : '폴더가 비어 있습니다'}
              description={isFiltered ? '현재 폴더에서 검색어나 필터를 바꿔 보세요.' : '이 폴더에는 하위 폴더나 아티팩트가 없습니다.'}
              actions={isFiltered ? <Button label="필터 초기화" onClick={reset} /> : undefined} />}
          </>}
          </>}
        </VStack>
        {mobile ? <ListingFooter {...listing.pagination(entries.length)} /> : null}
      </PageContent>
    </PageLayout>
    <MobileSurface title="필터" isOpen={filtersOpen} onOpenChange={setFiltersOpen}>
      <Layout header={<DialogHeader title="아티팩트 표시 옵션" onOpenChange={setFiltersOpen} />} content={<LayoutContent><VStack gap={4}>
        <SortFields options={sortOptions} value={{ key: draft.sort, direction: draft.direction }} onChange={value => setDraft({ ...draft, sort: value.key as DocSort, direction: value.direction })} />

        <PageSize value={draft.size} onChange={(size) => setDraft({ ...draft, size })} />
        <Button label="초기화" onClick={() => setDraft({ sort: 'title', direction: 'asc', filter: 'all', size: 25 })} />
        <Button label="적용" variant="primary" size="lg" onClick={() => { listing.change(draft); setFiltersOpen(false); }} />
      </VStack></LayoutContent>} />
    </MobileSurface>
    <BottomSheet label="새로 만들기" isOpen={createMenu} onOpenChange={setCreateMenu} height="hug">
      <VStack padding={4} gap={3}>
        <HStack justify="between" align="center"><Heading level={2}>새로 만들기</Heading><Button label="닫기" onClick={() => setCreateMenu(false)} /></HStack>
        <Button label="아티팩트 작성" icon={<HgiPlus />} size="lg" onClick={() => { setCreateMenu(false); setCreating('doc'); }} />
        <Button label="폴더 만들기" icon={<HgiFolder />} size="lg" onClick={() => { setCreateMenu(false); setCreating('folder'); }} />
      </VStack>
    </BottomSheet>
    {creating === 'doc' ? <ArtifactEditor projectId={destination} folderId={folderId} onClose={() => setCreating(null)} onSaved={id => { setCreating(null); onOpen(id); }} /> : null}
    {creating === 'folder' ? <CreateDialog title={`새 폴더 · ${destination ? projects.find(p => p.id === destination)?.name : "개인"}`} withBody={false} onClose={() => setCreating(null)} onSave={async title => { await folderMutation.mutateAsync(title); listing.change({ query: title }); }} /> : null}
    </>
  );
}
