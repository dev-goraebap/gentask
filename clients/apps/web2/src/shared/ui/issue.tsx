import { Badge, StatusDot, Text } from '@astryxdesign/core';
import type { IssueSummary } from '@/shared/api/client';

type Kind = IssueSummary['kind'];
type State = IssueSummary['state'];

const KIND: Record<Kind, { label: string; variant: 'purple' | 'blue' | 'neutral' | 'red' }> = {
  EPIC: { label: '에픽', variant: 'purple' },
  STORY: { label: '스토리', variant: 'blue' },
  TASK: { label: '태스크', variant: 'neutral' },
  BUG: { label: '버그', variant: 'red' },
};

/**
 * 상태는 다섯이고 그중 셋만 진행 중을 뜻한다. 색으로 가르되 글자를 함께 두어
 * 색만으로 판정하지 않게 한다.
 */
const STATE: Record<State, { label: string; variant: 'neutral' | 'accent' | 'success' | 'error' }> =
  {
    BACKLOG: { label: '백로그', variant: 'neutral' },
    UNSTARTED: { label: '예정', variant: 'neutral' },
    STARTED: { label: '진행', variant: 'accent' },
    COMPLETED: { label: '완료', variant: 'success' },
    CANCELED: { label: '취소', variant: 'error' },
  };

export function IssueKindBadge({ kind }: { readonly kind: Kind }) {
  const { label, variant } = KIND[kind];
  return <Badge label={label} variant={variant} />;
}

/**
 * StatusDot 은 점만 그리고 글자를 aria-label 로만 둔다. 색만으로 상태를 가르지 않도록
 * 글자를 곁에 세운다.
 */
export function IssueStateChip({ state }: { readonly state: State }) {
  const { label, variant } = STATE[state];
  return (
    <span className="state-chip">
      <StatusDot label={label} variant={variant} isPulsing={state === 'STARTED'} />
      <Text as="span" type="supporting" color="secondary">
        {label}
      </Text>
    </span>
  );
}

export const ISSUE_STATES: readonly State[] = [
  'BACKLOG',
  'UNSTARTED',
  'STARTED',
  'COMPLETED',
  'CANCELED',
];

export function issueStateLabel(state: State): string {
  return STATE[state].label;
}

export const ISSUE_KINDS: readonly Kind[] = ['EPIC', 'STORY', 'TASK', 'BUG'];

export function issueKindLabel(kind: Kind): string {
  return KIND[kind].label;
}
