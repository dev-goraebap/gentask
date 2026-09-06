import { CriteriaBadge, KindToken, StateDot, type ItemState } from '@/entities/issue';
import {
    Badge,
    ClickableCard,
    HStack,
    Text,
    VStack
} from '@astryxdesign/core';
import { COLUMN_WIDTH, type ViewProps } from './issues';

export function BoardColumn({ state, items, onOpen }: ViewProps & { readonly state: ItemState }) {
  return (
    <VStack gap={2}>
      <HStack gap={2} align="center">
        <StateDot state={state} />
        <Text type="supporting">{state}</Text>
        <Badge label={`${items.length}`} />
      </HStack>
      <VStack gap={2}>
        {items.map((item) => (
          <ClickableCard
            key={item.id}
            label={item.title}
            width={COLUMN_WIDTH}
            padding={3}
            variant="muted"
            onClick={() => onOpen(item.id)}
          >
            <VStack gap={2}>
              <HStack gap={2} align="center" wrap="wrap">
                <KindToken kind={item.kind} />
                <Text type="supporting">{item.id}</Text>
              </HStack>
              <Text>{item.title}</Text>
              <HStack gap={2} align="center" wrap="wrap">
                <CriteriaBadge item={item} />
                {item.assignee ? <Text type="supporting">{item.assignee}</Text> : null}
              </HStack>
            </VStack>
          </ClickableCard>
        ))}
      </VStack>
    </VStack>
  );
}
