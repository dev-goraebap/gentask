import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useLayoutEffect, useRef, useState } from 'react';

export interface ListingState { page: number; size: number; query: string; filter: string; sort: string; scroll: number }

export const saved = new Map<string, ListingState>();

export function resetListing(key: string) { saved.delete(key); }

export function useListing(key: string) {
  const [state, setState] = useState<ListingState>(() => saved.get(key) ?? { page: 1, size: 25, query: '', filter: 'all', sort: 'title', scroll: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const mobile = useMediaQuery('(max-width: 1024px)');
  const update = (patch: Partial<ListingState>) => setState((old) => {
    const next = { ...old, ...patch };
    saved.set(key, next);
    return next;
  });
  const change = (patch: Partial<ListingState>) => update({ page: 1, scroll: 0, ...patch });
  useLayoutEffect(() => { if (ref.current) ref.current.scrollTop = saved.get(key)?.scroll ?? state.scroll; }, [key, state.page, state.query, state.filter, state.sort, state.size, mobile]);
  return { ...state, mobile, ref, change, onScroll: () => {
    saved.set(key, { ...state, scroll: ref.current?.scrollTop ?? 0 });
  } };
}
