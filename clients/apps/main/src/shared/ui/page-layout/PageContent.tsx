import { LayoutContent, VStack } from '@astryxdesign/core';
import { useContext, type ComponentProps } from 'react';
import { PageWidthContext } from './context';

export function PageContent({ children, padding = 4, contentWidth, ...props }: ComponentProps<typeof LayoutContent> & { contentWidth?: string | number }) {
  const pageWidth = useContext(PageWidthContext);
  return <LayoutContent {...props} padding={0}>
    <VStack width="100%" maxWidth={contentWidth ?? pageWidth} padding={padding} style={{ marginInline: 'auto', boxSizing: 'border-box', minWidth: 0 }}>{children}</VStack>
  </LayoutContent>;
}
