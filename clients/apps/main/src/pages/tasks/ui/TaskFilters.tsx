import { TaskDateFilter } from './TaskDateFilter';
import { FilterIndicator } from '@/shared/ui/listing';
import { Button, CheckboxList, CheckboxListItem, Heading, HStack, MultiSelector, TextInput, Toolbar, VStack } from '@astryxdesign/core';
import { useState } from 'react';
import { MobileFilterBar, MobileFilterButton, MobileSurface } from '@/shared/ui/mobile';
import { SortFields, SortSelector } from '@/shared/ui/listing';
import { HgiSearch } from '@/shared/ui/icons';
import { DEFAULT_FILTERS, SORT_OPTIONS, STATE_OPTIONS, type TaskFilters as Filters } from '../model/filters';
export function TaskFilters({ mobile, query, onQueryChange, filters, onChange }: {
  mobile: boolean; query: string; onQueryChange: (value: string) => void;
  filters: Filters; onChange: (value: Filters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const filtered = filters.states.length > 0 || filters.dateMode !== 'today';
  const reset = () => { onQueryChange(''); onChange(DEFAULT_FILTERS); };
  return <>
    {mobile ? <MobileFilterBar leadingContent={<FilterIndicator />} label="작업 필터" searchLabel="작업 검색" placeholder="제목, 담당자로 검색" query={query} onQueryChange={onQueryChange}
      actions={<>
        <MobileFilterButton active={filtered} onClick={() => { setDraft(filters); setOpen(true); }} /></>} /> :
      <Toolbar className="page-filter-toolbar" label="작업 필터" size="sm"
        startContent={<><FilterIndicator /><TextInput label="작업 검색" isLabelHidden placeholder="제목, 담당자로 검색" value={query} onChange={onQueryChange} startIcon={<HgiSearch />} hasClear width="13.75rem" size="sm" />
          <TaskDateFilter value={filters} onChange={onChange} />
          <MultiSelector label="상태 필터" isLabelHidden placeholder="모든 상태" value={filters.states} options={STATE_OPTIONS} variant="ghost" size="sm"
            onChange={states => onChange({ ...filters, states })} triggerDisplay="count" formatValue={items => `상태 · ${items.length}`} hasSelectAll selectAllLabel="전체 선택" />
          {query || filtered ? <Button label="초기화" variant="secondary" onClick={reset} /> : null}</>}
        endContent={<SortSelector options={SORT_OPTIONS} value={filters.sort} onChange={sort => onChange({ ...filters, sort })} />} />}
    <MobileSurface title="작업 필터" isOpen={open} onOpenChange={setOpen} purpose="form">
      <VStack gap={4}><HStack justify="between" align="center"><Heading level={2}>필터</Heading><Button label="초기화" variant="secondary" onClick={() => setDraft(DEFAULT_FILTERS)} /></HStack>
        <TaskDateFilter value={draft} onChange={setDraft} />
        <CheckboxList label="상태" description="선택하지 않으면 모든 상태를 표시합니다." value={draft.states} onChange={states => setDraft({ ...draft, states })}>
          {STATE_OPTIONS.map(({ value, label }) => <CheckboxListItem key={value} value={value} label={label} />)}
        </CheckboxList>
        <SortFields options={SORT_OPTIONS} value={draft.sort} onChange={sort => setDraft({ ...draft, sort })} />
        <Button label="적용" variant="primary" size="lg" onClick={() => { onChange(draft); setOpen(false); }} />
      </VStack>
    </MobileSurface>
  </>;
}
