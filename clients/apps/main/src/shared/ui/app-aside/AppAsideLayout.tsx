import { Button, Heading, HStack, Layout, LayoutHeader, LayoutPanel, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import type { ReactNode } from 'react';
import { HgiCancel } from '@/shared/ui/icons';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { useAppAside } from './context';
import './app-aside.css';

export function AppAsideLayout({ children }: { children: ReactNode }) {
  const { active, displayed, close, setTarget } = useAppAside();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const height = 'var(--page-header-height)';
  return <Layout padding={0} height="fill" style={{ height: '100dvh', position: 'relative', overflow: 'clip' }}
    content={<VStack height="100%" inert={mobile && Boolean(active)} style={{ minWidth: 0 }}>{children}</VStack>}
    end={<LayoutPanel role="complementary" label={displayed?.title ?? '보조 패널'} padding={0} hasDivider isScrollable={false}
      className="app-aside-panel" data-open={Boolean(active)} data-mobile={mobile} inert={!active} aria-hidden={!active}>
      <VStack height="100%" gap={0} className="app-aside-inner" style={{ minHeight: 0 }}>
        <LayoutHeader hasDivider padding={0} height={height} className="app-aside-header">
          <HStack align="center" justify="between" paddingInline={3} height={`calc(${height} - var(--border-width))`}>
            <Heading level={3} accessibilityLevel={2} maxLines={1} style={{ fontSize: '1rem', lineHeight: 1.5 }}>{displayed?.title}</Heading>
            <Button label="패널 닫기" size="sm" icon={<HgiCancel />} isIconOnly variant="ghost" onClick={close} />
          </HStack>
        </LayoutHeader>
        <VStack ref={setTarget} style={{ flex: 1, minHeight: 0 }} />
      </VStack>
    </LayoutPanel>} />;
}
