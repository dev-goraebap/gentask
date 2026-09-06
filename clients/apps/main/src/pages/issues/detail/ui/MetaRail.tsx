import { canClose, CriteriaBadge, doneCount, ITEM_STATES, type ItemState, type WorkItem } from '@/entities/issue';
import {
    Banner,
    CheckboxInput,
    Divider,
    HStack,
    Selector,
    Text,
    VStack
} from '@astryxdesign/core';

export function MetaRail({
  item,
  onToggleCriterion,
  onStateChange,
}: {
  readonly item: WorkItem;
  readonly onToggleCriterion: (n: number) => void;
  readonly onStateChange: (state: ItemState) => void;
}) {
  const closable = canClose(item);
  const remaining = item.criteria.length - doneCount(item.criteria);

  return (
    <VStack gap={4}>
      <VStack gap={2}>
        <Text type="supporting">상태</Text>
        <Selector
          label="상태"
          isLabelHidden
          size="sm"
          value={item.state}
          options={ITEM_STATES.map((s) => ({
            value: s,
            label: s,
            // 인수 조건을 충족하지 않으면 완료로 옮길 수 없다.
            disabled: s === '완료' && !closable,
          }))}
          onChange={(v) => onStateChange(v as ItemState)}
        />
        {!closable && item.criteria.length > 0 ? (
          <Text type="supporting">인수 조건 {remaining}건이 남아 완료로 옮길 수 없습니다.</Text>
        ) : null}
        {item.criteria.length === 0 ? (
          <Text type="supporting">인수 조건이 없는 항목은 바로 완료할 수 있습니다.</Text>
        ) : null}
      </VStack>

      {item.assignee ? (
        <VStack gap={1}>
          <Text type="supporting">담당</Text>
          <Text>{item.assignee}</Text>
        </VStack>
      ) : null}

      {item.criteria.length > 0 ? (
        <>
          <Divider />
          <VStack gap={2}>
            <HStack gap={2} align="center" justify="between">
              <Text type="supporting">인수 조건</Text>
              <CriteriaBadge item={item} />
            </HStack>
            <VStack gap={1}>
              {item.criteria.map((c) => (
                <CheckboxInput
                  key={c.n}
                  size="sm"
                  label={`#${c.n} ${c.text}`}
                  value={c.done}
                  onChange={() => onToggleCriterion(c.n)}
                />
              ))}
            </VStack>
          </VStack>
        </>
      ) : null}

      {item.state === '완료' ? (
        <Banner status="success" title="완료" description="인수 조건을 모두 충족했습니다." />
      ) : null}
    </VStack>
  );
}
