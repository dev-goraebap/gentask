import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import {
    List
} from '@astryxdesign/core';
import { type ViewProps } from './issues';
import { ItemRow } from './ItemRow';

export function ListView({ items, onOpen }: ViewProps) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  return (
    <List hasDividers style={{ marginInline: mobile ? 'calc(-1 * var(--spacing-3))' : 'calc(-1 * var(--spacing-2))' }}>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} onOpen={onOpen} />
      ))}
    </List>
  );
}
