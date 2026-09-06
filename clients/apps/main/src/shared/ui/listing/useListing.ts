import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useLayoutEffect, useRef, useState } from 'react';

export interface ListingState { page: number; size: number; query: string; filter: string; sort: string; direction: 'asc' | 'desc'; scroll: number; mobileScroll: number; loaded: number; scope: string }
export const saved = new Map<string, ListingState>();
export function resetListing(key: string) { saved.delete(key); }

export function useListing(key: string, scope = '') {
  const initial = (): ListingState => ({ page: 1, size: 25, query: '', filter: 'all', sort: 'title', direction: 'asc', scroll: 0, mobileScroll: 0, loaded: 25, scope });
  const [entry, setEntry] = useState(() => ({ key, state: saved.get(key) ?? initial() }));
  let state = entry.key === key ? entry.state : saved.get(key) ?? initial();
  if (state.scope !== scope) state = { ...state, scope, page: 1, loaded: state.size, scroll: 0, mobileScroll: 0 };
  if (entry.key !== key || entry.state !== state) setEntry({ key, state });
  const ref = useRef<HTMLDivElement>(null);
  const mobile = useMediaQuery('(max-width: 1024px)');
  const persist = (next: ListingState) => { saved.set(key, next); setEntry({ key, state: next }); };
  const change = (patch: Partial<ListingState>) => {
    const resets = ['query', 'filter', 'sort', 'direction', 'size'].some(field => field in patch);
    const cached = saved.get(key);
    persist({ ...state, scroll: cached?.scroll ?? state.scroll, mobileScroll: cached?.mobileScroll ?? state.mobileScroll, ...(resets ? { page: 1, loaded: patch.size ?? state.size, scroll: 0, mobileScroll: 0 } : { [mobile ? 'mobileScroll' : 'scroll']: 0 }), ...patch });
  };
  const loadMore = () => persist({ ...state, scroll: saved.get(key)?.scroll ?? state.scroll, loaded: state.loaded + state.size, mobileScroll: ref.current?.scrollTop ?? state.mobileScroll });
  useLayoutEffect(() => {
    const cached = saved.get(key);
    const position = cached?.scope === scope ? cached : state;
    if (ref.current) ref.current.scrollTop = mobile ? position.mobileScroll : position.scroll;
    saved.set(key, { ...state, scroll: position.scroll, mobileScroll: position.mobileScroll });
  }, [key, scope, state.page, state.query, state.filter, state.sort, state.direction, state.size, state.loaded, mobile]);
  const range = (total: number) => {
    const page = Math.min(state.page, Math.max(1, Math.ceil(total / state.size)));
    return { start: mobile ? 0 : (page - 1) * state.size, end: mobile ? state.loaded : page * state.size, page };
  };
  return { ...state, mobile, ref, change, range,
    pagination: (total: number) => ({ total, page: range(total).page, size: state.size, mobile, shown: Math.min(state.loaded, total), onLoadMore: loadMore, onPage: (page: number) => change({ page }), onSize: (size: number) => change({ size }) }),
    onScroll: () => { saved.set(key, { ...state, ...saved.get(key), [mobile ? 'mobileScroll' : 'scroll']: ref.current?.scrollTop ?? 0 }); },
  };
}
