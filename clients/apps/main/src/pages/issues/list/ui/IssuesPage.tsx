import { IssueSortFields } from './IssueSortFields';
import { IssueSortSelector } from './IssueSortSelector';
import { ListingFooter, useListing } from '@/shared/ui/listing';
import { ITEM_STATES, useIssueStore } from '@/entities/issue';
import { ME } from '@/entities/session';
import { useWorkspaceStore } from '@/entities/workspace';
import { TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import {
    HgiCheck,
    HgiSearch,
    HgiSearchEmpty,
    HgiViewBoard,
    HgiViewList,
    HgiViewTree
} from '@/shared/ui/icons';
import { CreateButton, CreateDialog, MobileFilterBar, MobileFilterButton, MobileSurface } from '@/shared/ui/mobile';
import {
    Button, CheckboxList, CheckboxListItem, MultiSelector,
    DialogHeader,
    EmptyState,
    Heading,
    HStack,
    Layout,
    LayoutContent,
    LayoutHeader,
    MoreMenu,
    SegmentedControl,
    SegmentedControlItem,
    Selector,
    Text,
    TextInput,
    Toolbar,
    VStack
} from '@astryxdesign/core';
import { useMemo, useState } from 'react';
import { BoardView } from './BoardView';
import { compare, KIND_LABEL, KINDS, type IssuesProps, type IssueView, type SortDirection, type SortKey } from './issues';
import { ListView } from './ListView';
import { TreeView } from './TreeView';

export function IssuesPage({ projectId, items, view, onViewChange, onOpen }: IssuesProps) {
  const { addItem } = useIssueStore();
  const { projects } = useWorkspaceStore();
  const [creating, setCreating] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ state: [] as string[], kind: [] as string[], sort: 'id' as SortKey, direction: 'asc' as SortDirection, mineOnly: false, hideClosed: false, view });
  const [query, setQuery] = useState('');
  const [state, setState] = useState<string[]>([]);
  const [kind, setKind] = useState<string[]>([]);
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [sort, setSort] = useState<SortKey>('id');
  const [mineOnly, setMineOnly] = useState(false);
  const [hideClosed, setHideClosed] = useState(false);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const matched = items.filter((i) => {
      if (text && !`${i.id} ${i.title}`.toLowerCase().includes(text)) return false;
      if (state.length && !state.includes(i.state)) return false;
      if (kind.length && !kind.includes(i.kind)) return false;
      if (mineOnly && i.assignee !== ME) return false;
      if (hideClosed && (i.state === '완료' || i.state === '취소')) return false;
      return true;
    });
    return [...matched].sort(compare(sort, direction));
  }, [items, query, state, kind, sort, direction, mineOnly, hideClosed]);

  const listing = useListing(`issues:${projectId}`, JSON.stringify([query, state, kind, sort, direction, mineOnly, hideClosed, view]));
  const { mobile } = listing;
  const visible = filtered.slice(listing.range(filtered.length).start, listing.range(filtered.length).end);

  const isFiltered = Boolean(query || state.length || kind.length || mineOnly || hideClosed);

  const reset = () => {
    setQuery('');
    setState([]);
    setKind([]);
    setMineOnly(false);
    setHideClosed(false);
  };

  return (
    <>
    <Layout
      padding={0}
      height="fill"
      footer={!mobile && view === 'list' ? <ListingFooter {...listing.pagination(filtered.length)} /> : undefined}
      contentWidth={view === 'board' ? WIDTH.full : WIDTH.wide}
      header={
        <>
          {mobile ? <CreateButton label="새 이슈" onClick={() => setCreating(true)} /> : <LayoutHeader hasDivider padding={mobile ? 0 : undefined}>
            <VStack gap={2}>
            {/* 툴바가 자체 인셋을 가지므로 제목 행에도 같은 크기의 인라인 패딩을 준다. */}
            <HStack
              justify="between"
              align="center"
              width="100%"
              height={mobile ? undefined : TITLE_ROW}
              paddingBlock={mobile ? 2 : undefined} paddingBlockStart={mobile ? 2 : TITLE_PAD_TOP}
              paddingInline={mobile ? 3 : 4}
              gap={3}
            >
              <HStack gap={3} align="center">
                <Heading level={1}>이슈</Heading>
              </HStack>
              <CreateButton label="새 이슈" onClick={() => setCreating(true)} />
            </HStack>
              <VStack paddingInline={mobile ? 3 : 4}>
                <Text color="secondary">프로젝트 이슈를 정리하고 진행 상황을 관리합니다.</Text>
              </VStack>
            </VStack>
          </LayoutHeader>}

          {mobile ? <MobileFilterBar label="이슈 필터" searchLabel="이슈 검색" placeholder="제목이나 식별자" query={query} onQueryChange={setQuery}
            actions={<MobileFilterButton active={Boolean(state.length || kind.length || mineOnly || hideClosed)} onClick={() => { setDraft({ state, kind, sort, direction, mineOnly, hideClosed, view }); setFiltersOpen(true); }} />} /> : <Toolbar
              label="이슈 필터"
                className="page-filter-toolbar"
              size="sm"
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
                  width="13.75rem"
                />
                <MultiSelector
                  label="상태"
                  isLabelHidden
                  placeholder="모든 상태"
                  triggerDisplay="count" formatValue={items => `상태 · ${items.length}`} hasSelectAll selectAllLabel="전체 선택"
                  value={state}
                  onChange={setState}
                  options={ITEM_STATES.map((s) => ({ value: s, label: s }))}
                />
                <MultiSelector
                  label="종류"
                  isLabelHidden
                  placeholder="모든 종류"
                  triggerDisplay="count" formatValue={items => `종류 · ${items.length}`} hasSelectAll selectAllLabel="전체 선택"
                  value={kind}
                  onChange={setKind}
                  options={KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))}
                />
                {isFiltered ? (
                  <Button label="초기화" variant="ghost" onClick={reset} />
                ) : null}
              </>
            }
            endContent={
              <>
                <IssueSortSelector value={{ key: sort, direction }} onChange={value => { setSort(value.key); setDirection(value.direction); }} />
                <SegmentedControl
                  label="보기 방식"
                  size="sm"
                  value={view}
                  onChange={(v) => onViewChange(v as IssueView)}
                >
                  <SegmentedControlItem
                    value="list"
                    label="목록"
                    icon={<HgiViewList />}
                    isLabelHidden
                  />
                  <SegmentedControlItem
                    value="tree"
                    label="계층"
                    icon={<HgiViewTree />}
                    isLabelHidden
                  />
                  <SegmentedControlItem
                    value="board"
                    label="보드"
                    icon={<HgiViewBoard />}
                    isLabelHidden
                  />
                </SegmentedControl>
                <MoreMenu
                  label="표시 옵션"
                  items={[
                    {
                      id: 'mine',
                      label: '내 항목만',
                      endContent: mineOnly ? <HgiCheck size={14} /> : undefined,
                      onClick: () => setMineOnly(!mineOnly),
                    },
                    {
                      id: 'hide-closed',
                      label: '완료와 취소 숨기기',
                      endContent: hideClosed ? <HgiCheck size={14} /> : undefined,
                      onClick: () => setHideClosed(!hideClosed),
                    },
                  ]}
                />
              </>
              }
            />}
        </>
      }
    >
      <LayoutContent ref={listing.ref} onScroll={listing.onScroll} padding={mobile ? 3 : 4} style={mobile ? { paddingBottom: 'calc(var(--spacing-10) + var(--spacing-4))' } : undefined}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<HgiSearchEmpty />}
            title="조건에 맞는 항목이 없습니다"
            description="검색어나 필터를 바꿔 보세요."
            actions={isFiltered ? <Button label="필터 초기화" onClick={reset} /> : undefined}
          />
        ) : (
          <>
            {view === 'list' ? <ListView items={visible} onOpen={onOpen} /> : null}
            {/* 계층 뷰는 부모가 필터에서 빠지면 자식을 찾지 못하므로 전체 목록도 함께 넘긴다. */}
            {view === 'tree' ? (
              <TreeView items={filtered} all={items} onOpen={onOpen} />
            ) : null}
            {view === 'board' ? <BoardView items={filtered} onOpen={onOpen} /> : null}
          </>
        )}
        {mobile && view === 'list' ? <ListingFooter {...listing.pagination(filtered.length)} /> : null}
      </LayoutContent>
    </Layout>
    <MobileSurface title="이슈 필터" isOpen={filtersOpen} onOpenChange={setFiltersOpen}>
      <Layout header={<DialogHeader title="이슈 표시 옵션" onOpenChange={setFiltersOpen} />} content={<LayoutContent><VStack gap={4}>
        <CheckboxList label="상태" description="선택하지 않으면 모든 상태를 표시합니다." value={draft.state} onChange={state => setDraft({ ...draft, state })}>{ITEM_STATES.map(value => <CheckboxListItem key={value} value={value} label={value} />)}</CheckboxList>
        <CheckboxList label="종류" description="선택하지 않으면 모든 종류를 표시합니다." value={draft.kind} onChange={kind => setDraft({ ...draft, kind })}>{KINDS.map(value => <CheckboxListItem key={value} value={value} label={KIND_LABEL[value]} />)}</CheckboxList>
        <IssueSortFields value={{ key: draft.sort, direction: draft.direction }} onChange={value => setDraft({ ...draft, sort: value.key, direction: value.direction })} />
        <Selector label="보기 방식" value={draft.view} onChange={(view) => setDraft({ ...draft, view: view as IssueView })} options={[{ value: 'list', label: '목록' }, { value: 'tree', label: '계층' }, { value: 'board', label: '보드' }]} />
        <Selector label="담당자" value={draft.mineOnly ? 'mine' : 'all'} onChange={(v) => setDraft({ ...draft, mineOnly: v === 'mine' })} options={[{ value: 'all', label: '전체' }, { value: 'mine', label: '내 항목만' }]} />
        <Selector label="완료 항목" value={draft.hideClosed ? 'hide' : 'show'} onChange={(v) => setDraft({ ...draft, hideClosed: v === 'hide' })} options={[{ value: 'show', label: '표시' }, { value: 'hide', label: '완료와 취소 숨기기' }]} />
        <Button label="초기화" onClick={() => setDraft({ state: [], kind: [], sort: 'id', direction: 'asc', mineOnly: false, hideClosed: false, view: 'list' })} />
        <Button label="적용" variant="primary" size="lg" onClick={() => { setState(draft.state); setKind(draft.kind); setSort(draft.sort); setDirection(draft.direction); setMineOnly(draft.mineOnly); setHideClosed(draft.hideClosed); onViewChange(draft.view); setFiltersOpen(false); }} />
      </VStack></LayoutContent>} />
    </MobileSurface>
    {creating ? <CreateDialog title="새 이슈" onClose={() => setCreating(false)} onSave={(title, body) => { addItem(projects.find(p => p.id === projectId)?.prefix ?? 'GT', title, body); reset(); }} /> : null}
    </>
  );
}
