import { CriteriaBadge, KindToken, StateDot, type WorkItem } from '@/entities/issue';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import {
    HStack,
    Item
} from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';

export function ItemRow({
  item,
  onOpen,
}: {
  readonly item: WorkItem;
  readonly onOpen: (id: string) => void;
}) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  return (
    <Item
      as="li"
      onClick={() => onOpen(item.id)}
      startContent={<KindToken kind={item.kind} />}
      label={item.title}
      labelLines={mobile ? 2 : 1}
      density={mobile ? 'spacious' : 'balanced'}
      description={[item.id, item.assignee].filter(Boolean).join(' · ')}
      endContent={mobile ? <StateDot state={item.state} /> :
        <HStack gap={2} align="center">
          <CriteriaBadge item={item} />
          <StateDot state={item.state} />
        </HStack>
      }
    />
  );
}
