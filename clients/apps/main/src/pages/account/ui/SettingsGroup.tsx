import { Children, type ReactNode } from 'react';
import { Card, Divider, Text, VStack } from '@astryxdesign/core';

export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return <VStack gap={1.5}>
    <Text type="supporting" weight="semibold" color="secondary">{title}</Text>
    <Card variant="muted" padding={0} width="100%">
      <VStack gap={0}>
        {Children.toArray(children).map((child, index) => <VStack key={index} gap={0}>
          {index > 0 ? <Divider variant="subtle" /> : null}
          {child}
        </VStack>)}
      </VStack>
    </Card>
  </VStack>;
}
