import { Heading, HStack, LayoutHeader, MobileNavToggle, VStack } from '@astryxdesign/core';
import type { ReactNode } from 'react';
import { BackButton } from '@/shared/ui/navigation';

export function PageHeader({ title, toolbar, trailingAccessory, actions, onBack, backLabel = '목록으로', compact = false }: {
  title: string; toolbar?: ReactNode; trailingAccessory?: ReactNode; actions?: ReactNode; onBack?: () => void; backLabel?: string; compact?: boolean;
}) {
  const height = 'var(--page-header-height)';
  return <>
    <LayoutHeader hasDivider padding={0} height={height} className="page-header">
    <HStack align="center" gap={2} paddingInline={compact ? 3 : 4} height={`calc(${height} - var(--border-width))`}
      style={{ boxSizing: 'border-box', minWidth: 0 }}>
      <MobileNavToggle label="메뉴 열기" />
      {onBack ? <BackButton label={backLabel} size={compact ? 'lg' : 'sm'} onClick={onBack} /> : null}
      <VStack gap={0.5} style={{ flex: 1, minWidth: 0 }}>
        <Heading level={3} accessibilityLevel={1} maxLines={1} style={{ minWidth: 0 }}>{title}</Heading>
      </VStack>
      {actions ? <HStack align="center" gap={1} style={{ flexShrink: 0 }}>{actions}</HStack> : null}
      {trailingAccessory ? <HStack align="center" style={{ flexShrink: 0 }}>{trailingAccessory}</HStack> : null}
    </HStack>
    </LayoutHeader>
    {toolbar}
  </>;
}
