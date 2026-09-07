import { Layout } from '@astryxdesign/core';
import type { ComponentProps, CSSProperties } from 'react';
import { PageWidthContext } from './context';

export function PageLayout({ contentWidth, style, ...props }: ComponentProps<typeof Layout>) {
  return <PageWidthContext.Provider value={contentWidth}>
    <Layout {...props} style={{ ...style, '--layout-content-width': contentWidth ?? 'none' } as CSSProperties} />
  </PageWidthContext.Provider>;
}
