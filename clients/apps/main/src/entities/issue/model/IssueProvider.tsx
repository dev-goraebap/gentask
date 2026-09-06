import { useMemo, useState, type ReactNode } from 'react';
import { INITIAL_ITEMS, type WorkItem } from './data';

import { Context, type IssueStore } from './useIssueStore';

export function IssueProvider({ children }: { readonly children: ReactNode }) {
  const [items, setItems] = useState<WorkItem[]>(INITIAL_ITEMS);
  const value = useMemo<IssueStore>(() => ({
    items,
    addItem: (prefix, title, body) => setItems((prev) => {
      const n = Math.max(0, ...prev.filter((i) => i.id.startsWith(`${prefix}-`)).map((i) => Number(i.id.split('-')[1]))) + 1;
      return [{ id: `${prefix}-${n}`, kind: 'TASK', title, body, state: '백로그', criteria: [], docIds: [] }, ...prev];
    }),
    toggleCriterion: (itemId, n) =>
      setItems((prev) =>
        prev.map((i) =>
          i.id !== itemId
            ? i
            : {
              ...i,
              criteria: i.criteria.map((c) => (c.n === n ? { ...c, done: !c.done } : c)),
            },
        ),
      ),
    changeItemState: (itemId, state) =>
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, state } : i))),
    removeProjectItems: (prefix) => setItems(prev => prev.filter(item => !item.id.startsWith(`${prefix}-`)))
  }), [items]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
