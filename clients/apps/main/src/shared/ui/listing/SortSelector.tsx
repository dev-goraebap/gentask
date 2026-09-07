import { Button, ComplexSelector, VStack } from '@astryxdesign/core';
import { SortFields } from './SortFields';
import type { SortOption, SortValue } from './sort';

export function SortSelector({ value, onChange, options }: { value: SortValue; onChange: (value: SortValue) => void; options: SortOption[] }) {
  const selected = options.find(option => option.value === value.key);
  return <ComplexSelector label="정렬" isLabelHidden size="sm" variant="ghost" alignment="end" value={value} onChange={onChange}
    triggerLabel={`${selected?.label ?? ''}${selected?.hasDirection === false ? '' : ` · ${value.direction === 'asc' ? '오름차순' : '내림차순'}`}`}>
    {(current, change, close) => <VStack gap={3}><SortFields value={current} onChange={change} options={options} /><Button label="닫기" onClick={close} /></VStack>}
  </ComplexSelector>;
}
