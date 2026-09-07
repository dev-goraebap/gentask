import { BackButton } from '@/shared/ui/navigation';
import { Heading, HStack, LayoutHeader } from '@astryxdesign/core';
import type { ReactNode } from 'react';

export function MobilePageHeader({ title, onBack, backLabel = '목록으로', actions }: {
  title: string; onBack?: () => void; backLabel?: string; actions?: ReactNode;
}) {
  return <LayoutHeader hasDivider padding={0} height="var(--mobile-header-height)" className="mobile-page-header">
    <HStack align="center" gap={1} paddingInline={3} height="calc(var(--mobile-header-height) - var(--border-width))" style={{ boxSizing: 'border-box', minWidth: 0 }}>
      {onBack ? <BackButton label={backLabel} size="lg" onClick={onBack} /> : null}
      <Heading level={3} accessibilityLevel={1} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Heading>
      {actions ? <HStack align="center" gap={1} style={{ flexShrink: 0 }}>{actions}</HStack> : null}
    </HStack>
  </LayoutHeader>;
}
