import { VStack } from '@astryxdesign/core';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useAppAside } from './context';
export function AppAsideContent({ panelKey, children }: { panelKey: string; children: ReactNode }) {
  const { target, active, release } = useAppAside();
  useEffect(() => () => release(panelKey), [panelKey, release]);
  return target ? createPortal(<VStack height="100%" style={{ minHeight: 0, display: active?.key === panelKey ? undefined : 'none' }}>{children}</VStack>, target) : null;
}
