import { SortFields } from '@/shared/ui/listing';
import { SORT_LABEL, type SortKey, type SortDirection } from './issues';

export function IssueSortFields({ value, onChange }: { value: { key: SortKey; direction: SortDirection }; onChange: (value: { key: SortKey; direction: SortDirection }) => void }) {
  return <SortFields value={value} onChange={next => onChange({ ...next, key: next.key as SortKey })}
    options={Object.entries(SORT_LABEL).map(([value, label]) => ({ value, label, defaultDirection: value === 'progress' ? 'desc' : 'asc' }))} />;
}
