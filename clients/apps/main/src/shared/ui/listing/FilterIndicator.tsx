import { HStack } from '@astryxdesign/core';
import { HgiFilter } from '@/shared/ui/icons';

export function FilterIndicator() {
  return <HStack aria-hidden="true" align="center" className="filter-indicator"
    style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}><HgiFilter size={18} /></HStack>;
}
