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
import { CreateButton, CreateDialog, MOBILE_QUERY, MobileSurface } from '@/shared/ui/mobile';
import {
    Button,
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
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useMemo, useState } from 'react';
import { BoardView } from './BoardView';
import { compare, KIND_LABEL, KINDS, SORT_LABEL, type IssuesProps, type IssueView, type SortKey } from './issues';
import { ListView } from './ListView';
import { TreeView } from './TreeView';

export function IssuesPage({ projectId, items, view, onViewChange, onOpen }: IssuesProps) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const { addItem } = useIssueStore();
  const { projects } = useWorkspaceStore();
  const [creating, setCreating] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ state: null as string | null, kind: null as string | null, sort: 'id' as SortKey, mineOnly: false, hideClosed: false, view });
  const [query, setQuery] = useState('');
  const [state, setState] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('id');
  const [mineOnly, setMineOnly] = useState(false);
  const [hideClosed, setHideClosed] = useState(false);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const matched = items.filter((i) => {
      if (text && !`${i.id} ${i.title}`.toLowerCase().includes(text)) return false;
      if (state && i.state !== state) return false;
      if (kind && i.kind !== kind) return false;
      if (mineOnly && i.assignee !== ME) return false;
      if (hideClosed && (i.state === '완료' || i.state === '취소')) return false;
      return true;
    });
    return [...matched].sort(compare(sort));
  }, [items, query, state, kind, sort, mineOnly, hideClosed]);

  const isFiltered = Boolean(query || state || kind || mineOnly || hideClosed);

  const reset = () => {
    setQuery('');
    setState(null);
    setKind(null);
    setMineOnly(false);
    setHideClosed(false);
  };

  return (
    <>
    <Layout
      padding={0}
      height="fill"
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

          {mobile ? <Toolbar
            label="이슈 필터"
            size="lg"
            startContent={<HStack gap={2} width="100%" style={{ flexWrap: 'wrap', minWidth: 0 }}>
              <VStack style={{ flex: '1 1 10rem', minWidth: 0 }}><TextInput label="이슈 검색" isLabelHidden placeholder="제목이나 식별자" value={query} onChange={setQuery} hasClear width="100%" /></VStack>
              <Button label={`필터${state || kind || mineOnly || hideClosed ? ' · 적용' : ''}`} onClick={() => { setDraft({ state, kind, sort, mineOnly, hideClosed, view }); setFiltersOpen(true); }} />
            </HStack>}
          /> : <Toolbar
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
                <Selector
                  label="상태"
                  isLabelHidden
                  placeholder="상태"
                  hasClear
                  value={state}
                  onChange={setState}
                  options={ITEM_STATES.map((s) => ({ value: s, label: s }))}
                />
                <Selector
                  label="종류"
                  isLabelHidden
                  placeholder="종류"
                  hasClear
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
                <Selector
                  label="정렬"
                  isLabelHidden
                  value={sort}
                  onChange={(v) => setSort(v as SortKey)}
                  options={(Object.keys(SORT_LABEL) as SortKey[]).map((k) => ({
                    value: k,
                    label: SORT_LABEL[k],
                  }))}
                />
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
      <LayoutContent padding={mobile ? 3 : 4} style={mobile ? { paddingBottom: 'calc(var(--spacing-10) + var(--spacing-4))' } : undefined}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<HgiSearchEmpty />}
            title="조건에 맞는 항목이 없습니다"
            description="검색어나 필터를 바꿔 보세요."
            actions={isFiltered ? <Button label="필터 초기화" onClick={reset} /> : undefined}
          />
        ) : (
          <>
            {view === 'list' ? <ListView items={filtered} onOpen={onOpen} /> : null}
            {/* 계층 뷰는 부모가 필터에서 빠지면 자식을 찾지 못하므로 전체 목록도 함께 넘긴다. */}
            {view === 'tree' ? (
              <TreeView items={filtered} all={items} onOpen={onOpen} />
            ) : null}
            {view === 'board' ? <BoardView items={filtered} onOpen={onOpen} /> : null}
          </>
        )}
      </LayoutContent>
    </Layout>
    <MobileSurface title="이슈 필터" isOpen={filtersOpen} onOpenChange={setFiltersOpen}>
      <Layout header={<DialogHeader title="이슈 표시 옵션" onOpenChange={setFiltersOpen} />} content={<LayoutContent><VStack gap={4}>
        <Selector label="상태" value={draft.state} hasClear placeholder="모든 상태" onChange={(state) => setDraft({ ...draft, state })} options={ITEM_STATES.map((value) => ({ value, label: value }))} />
        <Selector label="종류" value={draft.kind} hasClear placeholder="모든 종류" onChange={(kind) => setDraft({ ...draft, kind })} options={KINDS.map((value) => ({ value, label: KIND_LABEL[value] }))} />
        <Selector label="정렬" value={draft.sort} onChange={(sort) => setDraft({ ...draft, sort: sort as SortKey })} options={Object.entries(SORT_LABEL).map(([value, label]) => ({ value, label }))} />
        <Selector label="보기 방식" value={draft.view} onChange={(view) => setDraft({ ...draft, view: view as IssueView })} options={[{ value: 'list', label: '목록' }, { value: 'tree', label: '계층' }, { value: 'board', label: '보드' }]} />
        <Selector label="담당자" value={draft.mineOnly ? 'mine' : 'all'} onChange={(v) => setDraft({ ...draft, mineOnly: v === 'mine' })} options={[{ value: 'all', label: '전체' }, { value: 'mine', label: '내 항목만' }]} />
        <Selector label="완료 항목" value={draft.hideClosed ? 'hide' : 'show'} onChange={(v) => setDraft({ ...draft, hideClosed: v === 'hide' })} options={[{ value: 'show', label: '표시' }, { value: 'hide', label: '완료와 취소 숨기기' }]} />
        <Button label="초기화" onClick={() => setDraft({ state: null, kind: null, sort: 'id', mineOnly: false, hideClosed: false, view: 'list' })} />
        <Button label="결과 보기" variant="primary" size="lg" onClick={() => { setState(draft.state); setKind(draft.kind); setSort(draft.sort); setMineOnly(draft.mineOnly); setHideClosed(draft.hideClosed); onViewChange(draft.view); setFiltersOpen(false); }} />
      </VStack></LayoutContent>} />
    </MobileSurface>
    {creating ? <CreateDialog title="새 이슈" onClose={() => setCreating(false)} onSave={(title, body) => { addItem(projects.find(p => p.id === projectId)?.prefix ?? 'GT', title, body); reset(); }} /> : null}
    </>
  );
}
