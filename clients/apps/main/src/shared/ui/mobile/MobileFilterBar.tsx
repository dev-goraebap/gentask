import { TextInput, Toolbar } from '@astryxdesign/core';
import type { ReactNode } from 'react';
import { HgiSearch } from '@/shared/ui/icons';

export function MobileFilterBar({ label, searchLabel, placeholder, query, onQueryChange, leadingContent, actions }: {
  label: string; searchLabel: string; placeholder: string; query: string;
  onQueryChange: (value: string) => void; leadingContent?: ReactNode; actions?: ReactNode;
}) {
  return <Toolbar className="page-filter-toolbar" label={label} size="lg" gap={2} startContent={<>
    {leadingContent}
    <TextInput label={searchLabel} isLabelHidden placeholder={placeholder} value={query} onChange={onQueryChange} startIcon={<HgiSearch />} hasClear width="13.75rem" />
    {actions}
  </>} />;
}
