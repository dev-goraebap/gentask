import { Badge } from '@astryxdesign/core';
import { type WorkItem } from '../model/data';
import { doneCount } from './issue-status';

export function CriteriaBadge({ item }: { readonly item: WorkItem }) {
  if (item.criteria.length === 0) return null;
  const done = doneCount(item.criteria);
  const all = item.criteria.length;
  return (
    <Badge
      variant={done === all ? 'success' : 'neutral'}
      label={`인수 조건 ${done}/${all}`}
    />
  );
}
