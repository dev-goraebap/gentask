import { RadioList, RadioListItem, VStack } from '@astryxdesign/core';
import type { SortOption, SortValue, SortDirection } from './sort';

export function SortFields({ value, onChange, options }: { value: SortValue; onChange: (value: SortValue) => void; options: SortOption[] }) {
  return <VStack gap={4}>
    <RadioList label="정렬 기준" value={value.key} onChange={key => onChange({ key, direction: options.find(option => option.value === key)?.defaultDirection ?? 'asc' })}>
      {options.map(option => <RadioListItem key={option.value} value={option.value} label={option.label} />)}
    </RadioList>
    {options.find(option => option.value === value.key)?.hasDirection !== false ? <RadioList label="정렬 방향" value={value.direction} onChange={direction => onChange({ ...value, direction: direction as SortDirection })}>
      <RadioListItem value="asc" label="오름차순" />
      <RadioListItem value="desc" label="내림차순" />
    </RadioList> : null}
  </VStack>;
}
