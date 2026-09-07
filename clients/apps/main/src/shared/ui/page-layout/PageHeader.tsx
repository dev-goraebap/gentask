import { Heading, HStack, LayoutHeader, Text, VStack } from '@astryxdesign/core';
import type { ReactNode } from 'react';
import { BackButton } from '@/shared/ui/navigation';

export function PageHeader({ title, description, actions, onBack, backLabel = '목록으로', compact = false }: {
  title: string; description?: string; actions?: ReactNode; onBack?: () => void; backLabel?: string; compact?: boolean;
}) {
  const hasDescription = Boolean(description) && !compact;
  const height = 'var(--page-header-height)';
  return <LayoutHeader hasDivider padding={0} height={height} className="page-header">
    <HStack align="center" gap={2} paddingInline={compact ? 3 : 4} height={`calc(${height} - var(--border-width))`}
      style={{ boxSizing: 'border-box', minWidth: 0 }}>
      {onBack ? <BackButton label={backLabel} size={compact ? 'lg' : 'sm'} onClick={onBack} /> : null}
      <VStack gap={0.5} style={{ flex: 1, minWidth: 0 }}>
        <Heading level={3} accessibilityLevel={1} maxLines={1} style={{ minWidth: 0 }}>{title}</Heading>
        {hasDescription ? <Text type="supporting" color="secondary" maxLines={1} style={{ minWidth: 0 }}>{description}</Text> : null}
      </VStack>
      {actions ? <HStack align="center" gap={1} style={{ flexShrink: 0 }}>{actions}</HStack> : null}
    </HStack>
  </LayoutHeader>;
}
