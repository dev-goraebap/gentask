import type { ReactNode } from 'react';
import { HStack, Text, VStack } from '@astryxdesign/core';

export function SettingsRow({ title, description, icon, control, children }: {
  title: string; description?: ReactNode; icon: ReactNode; control?: ReactNode; children?: ReactNode;
}) {
  return <VStack padding={3} gap={3}>
    <HStack gap={3} align="center" className="account-settings-row">
      <HStack gap={2} align="start" style={{ flex: 1, minWidth: 0 }}>
        <HStack align="center" style={{ flexShrink: 0, height: 'calc(var(--text-body-size) * var(--text-body-leading))', color: 'var(--color-icon-secondary)' }}>{icon}</HStack>
        <VStack gap={0.5} style={{ minWidth: 0 }}>
          <Text weight="semibold">{title}</Text>
          {description ? <Text type="supporting" color="secondary">{description}</Text> : null}
        </VStack>
      </HStack>
      {control ? <HStack gap={1} wrap="wrap" className="account-settings-control">{control}</HStack> : null}
    </HStack>
    {children}
  </VStack>;
}
