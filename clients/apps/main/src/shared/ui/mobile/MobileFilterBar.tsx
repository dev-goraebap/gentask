import { HStack, TextInput, Toolbar, VStack } from '@astryxdesign/core';
import type { ReactNode } from 'react';
import { HgiSearch } from '@/shared/ui/icons';

export function MobileFilterBar({ label, searchLabel, placeholder, query, onQueryChange, actions }: {
  label: string; searchLabel: string; placeholder: string; query: string;
  onQueryChange: (value: string) => void; actions?: ReactNode;
}) {
  return <Toolbar label={label} size="lg" startContent={
    <HStack gap={2} width="100%" wrap="wrap" align="center" style={{ minWidth: 0 }}>
      <VStack style={{ flex: '1 1 10rem', minWidth: 0 }}>
        <TextInput label={searchLabel} isLabelHidden placeholder={placeholder} value={query} onChange={onQueryChange} startIcon={<HgiSearch />} hasClear width="100%" />
      </VStack>
      {actions ? <HStack gap={2} wrap="wrap" align="center">{actions}</HStack> : null}
    </HStack>
  } />;
}
