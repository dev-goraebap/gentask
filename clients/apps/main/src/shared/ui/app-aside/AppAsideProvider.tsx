import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AppAsideContext, type AsideEntry } from './context';
export function AppAsideProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<AsideEntry | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const open = useCallback((entry: AsideEntry) => setActive(entry), []);
  const close = useCallback(() => setActive(null), []);
  const release = useCallback((key: string) => setActive(value => value?.key === key ? null : value), []);
  const value = useMemo(() => ({ active, target, open, close, release, setTarget }), [active, target, open, close, release]);
  return <AppAsideContext.Provider value={value}>{children}</AppAsideContext.Provider>;
}
