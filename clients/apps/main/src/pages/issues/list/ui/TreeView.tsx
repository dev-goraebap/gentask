import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { type WorkItem } from '@/entities/issue';
import {
    List,
    Text,
    VStack
} from '@astryxdesign/core';
import { type ViewProps } from './issues';
import { ItemRow } from './ItemRow';

export function TreeView({
  items,
  all,
  onOpen,
}: ViewProps & { readonly all: readonly WorkItem[] }) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const shown = new Set(items.map((i) => i.id));
  const roots = items.filter((i) => !i.parentId || !shown.has(i.parentId));
  const childrenOf = (id: string) => items.filter((i) => i.parentId === id && shown.has(id));

  const orphanNote = (item: WorkItem) => {
    if (!item.parentId || shown.has(item.parentId)) return undefined;
    const parent = all.find((p) => p.id === item.parentId);
    return parent ? `필터에서 제외된 상위 · ${parent.id} ${parent.title}` : undefined;
  };

  return (
    <VStack gap={3}>
      {roots.map((root) => (
        <VStack key={root.id} gap={0}>
          {orphanNote(root) ? <Text type="supporting">{orphanNote(root)}</Text> : null}
          <List hasDividers style={{ marginInline: mobile ? 'calc(-1 * var(--spacing-3))' : 'calc(-1 * var(--spacing-2))' }}>
            <ItemRow item={root} onOpen={onOpen} />
          </List>
          {childrenOf(root.id).map((child) => (
            <VStack key={child.id} paddingInlineStart={6} gap={0}>
              <List hasDividers style={{ marginInline: mobile ? 'calc(-1 * var(--spacing-3))' : 'calc(-1 * var(--spacing-2))' }}>
                <ItemRow item={child} onOpen={onOpen} />
              </List>
              {childrenOf(child.id).map((grand) => (
                <VStack key={grand.id} paddingInlineStart={6} gap={0}>
                  <List hasDividers style={{ marginInline: mobile ? 'calc(-1 * var(--spacing-3))' : 'calc(-1 * var(--spacing-2))' }}>
                    <ItemRow item={grand} onOpen={onOpen} />
                  </List>
                </VStack>
              ))}
            </VStack>
          ))}
        </VStack>
      ))}
    </VStack>
  );
}
