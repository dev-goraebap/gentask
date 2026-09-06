import { DOC_FOLDERS, DOCS, type Doc } from '@/entities/document';
import { ME } from '@/entities/session';
import { TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { HgiCheck, HgiFile, HgiFolder, HgiPlus, HgiSearch, HgiSearchEmpty } from '@/shared/ui/icons';
import { ListingFooter, PageSize, useListing } from '@/shared/ui/listing';
import { CreateButton, CreateDialog, MobileSurface } from '@/shared/ui/mobile';
import {
    Badge, BottomSheet,
    BreadcrumbItem,
    Breadcrumbs,
    Button,
    DialogHeader,
    EmptyState,
    Heading,
    HStack,
    Item,
    Layout,
    LayoutContent,
    LayoutHeader,
    List,
    MoreMenu,
    Selector,
    Text,
    TextInput,
    Toolbar,
    VStack
} from '@astryxdesign/core';
import { useMemo, useState } from 'react';

import { SORT_LABEL, type DocSort, type DocsProps } from './documents';

export function DocumentsPage({ items, onOpen, folderId, onFolderChange, projectId }: DocsProps) {
  const listing = useListing(`docs:${projectId}:${folderId ?? ''}`);
  const { query, mobile } = listing;
  const sort = listing.sort as DocSort;
  const linkedOnly = listing.filter === 'linked';
  const setQuery = (query: string) => listing.change({ query });
  const setSort = (sort: DocSort) => listing.change({ sort });
  const setLinkedOnly = (value: boolean) => listing.change({ filter: value ? 'linked' : 'all' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ sort, filter: listing.filter, size: listing.size });
  const [createMenu, setCreateMenu] = useState(false);
  const [creating, setCreating] = useState<'doc' | 'folder' | null>(null);
  const [revision, setRevision] = useState(0);

  const derivedCount = (doc: Doc) => items.filter((i) => i.docIds.includes(doc.id)).length;

  const matched = useMemo(() => {
    const text = query.trim().toLowerCase();
    const found = DOCS.filter((d) => {
      if (text && !`${d.id} ${d.title}`.toLowerCase().includes(text)) return false;
      if ((d.projectId ?? 'dental') !== projectId) return false;
      if (d.folderId !== folderId) return false;
      if (linkedOnly && derivedCount(d) === 0) return false;
      return true;
    });
    return [...found].sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title, 'ko') :
        (b.updatedOn ?? '2026-09-01').localeCompare(a.updatedOn ?? '2026-09-01') || a.id.localeCompare(b.id),
    );
    // derivedCount는 items에서 파생되므로 items를 의존성으로 둔다.
  }, [items, query, folderId, sort, linkedOnly, revision, projectId]);

  const folders = DOC_FOLDERS.filter((f) => (f.projectId ?? 'dental') === projectId && f.parentId === folderId &&
    f.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  const currentFolder = DOC_FOLDERS.find((f) => f.id === folderId && (f.projectId ?? 'dental') === projectId);
  const entries = [
    ...folders.map((folder) => ({ kind: 'folder' as const, folder })),
    ...matched.map((doc) => ({ kind: 'doc' as const, doc })),
  ];
  const page = Math.min(listing.page, Math.max(1, Math.ceil(entries.length / listing.size)));
  const visible = entries.slice((page - 1) * listing.size, page * listing.size);
  const ancestors = [];
  let ancestor = currentFolder;
  while (ancestor) {
    ancestors.unshift(ancestor);
    ancestor = DOC_FOLDERS.find((f) => f.id === ancestor?.parentId);
  }
  const isFiltered = Boolean(query || linkedOnly);

  const reset = () => {
    setQuery('');
    setLinkedOnly(false);
  };

  return (
    <>
    <Layout
      padding={0}
      height="fill"
      contentWidth={WIDTH.wide}
      header={
        <>
          {mobile ? <CreateButton label="새로 만들기" onClick={() => setCreateMenu(true)} /> : <LayoutHeader hasDivider padding={mobile ? 0 : undefined}>
            <VStack gap={2}>
            <HStack
              justify="between"
              align="center"
              width="100%"
              height={mobile ? undefined : TITLE_ROW}
              paddingBlock={mobile ? 2 : undefined} paddingBlockStart={mobile ? 2 : TITLE_PAD_TOP}
              paddingInline={mobile ? 3 : 4}
              gap={3}
            >
              <Heading level={1}>문서</Heading>
              <HStack gap={2} align="center">
                {!mobile ? <Button label="새 폴더" variant="secondary" size="sm" icon={<HgiFolder />} onClick={() => setCreating('folder')} /> : null}
                <CreateButton label={mobile ? "새로 만들기" : "새 문서"} onClick={() => mobile ? setCreateMenu(true) : setCreating('doc')} />
              </HStack>
            </HStack>
              <VStack paddingInline={mobile ? 3 : 4}>
                <Text color="secondary">프로젝트 문서를 작성하고 폴더별로 정리합니다.</Text>
              </VStack>
            </VStack>
          </LayoutHeader>}

          <Toolbar className={mobile ? undefined : "page-filter-toolbar"}
              label="문서 필터"
              size={mobile ? 'lg' : 'sm'}
              startContent={
                <>
                  <TextInput
                    label="검색"
                    isLabelHidden
                    placeholder="제목이나 식별자"
                    value={query}
                    onChange={setQuery}
                    startIcon={<HgiSearch />}
                    hasClear
                    width={mobile ? 'min(calc(100vw - 130px), 800px)' : 220}
                    size={mobile ? 'lg' : 'sm'}
                  />

                  {mobile ? <Button label={linkedOnly ? '필터 · 1' : '필터'} size="lg" onClick={() => { setDraft({ sort, filter: listing.filter, size: listing.size }); setFiltersOpen(true); }} /> :
                    isFiltered ? <Button label="초기화" variant="ghost" onClick={reset} /> : null}
                </>
              }
              endContent={mobile ? undefined :
                <>
                  <Selector
                    label="정렬"
                    isLabelHidden
                    value={sort}
                    onChange={(v) => setSort(v as DocSort)}
                    options={(Object.keys(SORT_LABEL) as DocSort[]).map((k) => ({
                      value: k,
                      label: SORT_LABEL[k],
                    }))}
                  />
                  <MoreMenu
                    label="표시 옵션"
                    items={[
                      {
                        id: 'linked',
                        label: '작업 항목이 연결된 문서만',
                        endContent: linkedOnly ? <HgiCheck size={14} /> : undefined,
                        onClick: () => setLinkedOnly(!linkedOnly),
                      },
                    ]}
                  />
                </>
              }
            />
        </>
      }
      footer={mobile ? undefined : <ListingFooter total={entries.length} page={page} size={listing.size} mobile={mobile}
        onPage={(page) => listing.change({ page })} onSize={(size) => listing.change({ size })} />}
    >
      <LayoutContent padding={mobile ? 3 : 4} style={mobile ? { paddingBottom: 'calc(var(--spacing-10) + var(--spacing-4))' } : undefined} ref={listing.ref} onScroll={listing.onScroll}>
        <VStack gap={4}>
          <HStack justify="between" align="center" gap={2} wrap="wrap" padding={0}>
          <Breadcrumbs label="문서 폴더 경로">
            <BreadcrumbItem isCurrent={!folderId} onClick={() => onFolderChange(null)}>전체 문서</BreadcrumbItem>
            {ancestors.map((folder) => <BreadcrumbItem key={folder.id} isCurrent={folder.id === folderId}
              onClick={() => onFolderChange(folder.id)}>{folder.title}</BreadcrumbItem>)}
          </Breadcrumbs>
            {currentFolder ? <Button label="상위 폴더로" variant="ghost" size="sm"
              onClick={() => onFolderChange(currentFolder.parentId)} /> : null}
          </HStack>
          {folderId && !currentFolder ? <EmptyState title="폴더를 찾을 수 없습니다"
            actions={<Button label="전체 문서로" onClick={() => onFolderChange(null)} />} /> : <>
            {folders.length || matched.length ? <List hasDividers style={{ marginInline: mobile ? 'calc(-1 * var(--spacing-3))' : 'calc(-1 * var(--spacing-2))' }}>
              {visible.map((entry) => entry.kind === 'folder' ?
                <Item key={entry.folder.id} as="li" label={entry.folder.title} density={mobile ? 'spacious' : 'balanced'}
                  startContent={<HgiFolder size={16} />} onClick={() => onFolderChange(entry.folder.id)} description="폴더" /> :
                <Item key={entry.doc.id} as="li" label={entry.doc.title} density={mobile ? 'spacious' : 'balanced'} labelLines={mobile ? 2 : 1}
                  startContent={<HgiFile size={15} />} onClick={() => onOpen(entry.doc.id)}
                  description={`${entry.doc.updatedBy} · ${entry.doc.updatedAt}${mobile && derivedCount(entry.doc) ? ` · 작업 항목 ${derivedCount(entry.doc)}` : ''}`}
                  endContent={!mobile && derivedCount(entry.doc) > 0 ? <Badge label={`작업 항목 ${derivedCount(entry.doc)}`} /> : null} />)}
            </List> : <EmptyState icon={isFiltered ? <HgiSearchEmpty /> : <HgiFolder />}
              title={isFiltered ? '조건에 맞는 항목이 없습니다' : '폴더가 비어 있습니다'}
              description={isFiltered ? '현재 폴더에서 검색어나 필터를 바꿔 보세요.' : '이 폴더에는 하위 폴더나 문서가 없습니다.'}
              actions={isFiltered ? <Button label="필터 초기화" onClick={reset} /> : undefined} />}
          </>}
        </VStack>
        {mobile ? <ListingFooter total={entries.length} page={page} size={listing.size} mobile={mobile}
        onPage={(page) => listing.change({ page })} onSize={(size) => listing.change({ size })} /> : null}
      </LayoutContent>
    </Layout>
    <MobileSurface title="필터" isOpen={filtersOpen} onOpenChange={setFiltersOpen}>
      <Layout header={<DialogHeader title="문서 표시 옵션" onOpenChange={setFiltersOpen} />} content={<LayoutContent><VStack gap={4}>
        <Selector label="정렬" value={draft.sort} onChange={(value) => setDraft({ ...draft, sort: value as DocSort })}
          options={Object.entries(SORT_LABEL).map(([value, label]) => ({ value, label }))} />
        <Selector label="문서 표시" value={draft.filter} onChange={(filter) => setDraft({ ...draft, filter })}
          options={[{ value: 'all', label: '모든 문서' }, { value: 'linked', label: '작업 항목이 연결된 문서' }]} />
        <PageSize value={draft.size} onChange={(size) => setDraft({ ...draft, size })} />
        <Button label="초기화" onClick={() => setDraft({ sort: 'title', filter: 'all', size: 25 })} />
        <Button label="결과 보기" variant="primary" size="lg" onClick={() => { listing.change(draft); setFiltersOpen(false); }} />
      </VStack></LayoutContent>} />
    </MobileSurface>
    <BottomSheet label="새로 만들기" isOpen={createMenu} onOpenChange={setCreateMenu} height="hug">
      <VStack padding={4} gap={3}>
        <HStack justify="between" align="center"><Heading level={2}>새로 만들기</Heading><Button label="닫기" onClick={() => setCreateMenu(false)} /></HStack>
        <Button label="문서 작성" icon={<HgiPlus />} size="lg" onClick={() => { setCreateMenu(false); setCreating('doc'); }} />
        <Button label="폴더 만들기" icon={<HgiFolder />} size="lg" onClick={() => { setCreateMenu(false); setCreating('folder'); }} />
      </VStack>
    </BottomSheet>
    {creating ? <CreateDialog title={creating === 'doc' ? '새 문서' : '새 폴더'} withBody={creating === 'doc'} onClose={() => setCreating(null)}
      onSave={(title, body) => {
        const id = crypto.randomUUID();
        if (creating === 'folder') DOC_FOLDERS.push({ id, projectId, parentId: folderId, title });
        else DOCS.push({ id, projectId, folderId, title, body, updatedAt: '방금', updatedBy: ME, updatedOn: new Date().toISOString().slice(0, 10) });
        setRevision((v) => v + 1);
        listing.change({ query: title, filter: 'all' });
      }} /> : null}
    </>
  );
}
