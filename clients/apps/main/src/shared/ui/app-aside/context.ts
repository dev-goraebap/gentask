import { createContext, useContext } from 'react';
export type AsideEntry = { key: string; title: string };
export const AppAsideContext = createContext<{
  active: AsideEntry | null; target: HTMLElement | null;
  open: (entry: AsideEntry) => void; close: () => void; release: (key: string) => void;
  setTarget: (element: HTMLElement | null) => void;
} | null>(null);
export function useAppAside() {
  const context = useContext(AppAsideContext);
  if (!context) throw new Error('AppAsideProvider is required');
  return context;
}
