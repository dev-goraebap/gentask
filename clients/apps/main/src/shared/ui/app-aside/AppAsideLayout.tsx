import { Button, Heading, HStack, Layout, LayoutHeader, LayoutPanel, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import type { ReactNode } from 'react';
import { HgiCancel } from '@/shared/ui/icons';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { useAppAside } from './context';
export function AppAsideLayout({ children }: { children: ReactNode }) {
  const { active, close, setTarget } = useAppAside();
  const mobile = useMediaQuery(MOBILE_QUERY);
  return <Layout padding={0} height="fill" style={{ height: '100dvh' }}
    content={<VStack height="100%" style={{ minWidth: 0, display: mobile && active ? 'none' : undefined }}>{children}</VStack>}
    end={<LayoutPanel role="complementary" label={active?.title ?? '보조 패널'} width={mobile ? '100%' : '24rem'} padding={0} hasDivider isScrollable={false} style={{ display: active ? undefined : 'none' }}>
      <VStack height="100%" gap={0} style={{ minHeight: 0 }}>
        <LayoutHeader hasDivider padding={3}><HStack align="center" justify="between"><Heading level={3} accessibilityLevel={2}>{active?.title}</Heading><Button label="패널 닫기" icon={<HgiCancel />} isIconOnly variant="ghost" onClick={close} /></HStack></LayoutHeader>
        <VStack ref={setTarget} style={{ flex: 1, minHeight: 0 }} />
      </VStack>
    </LayoutPanel>} />;
}
