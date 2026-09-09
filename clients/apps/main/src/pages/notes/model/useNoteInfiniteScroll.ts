import { useEffect, useRef, type RefObject } from 'react';

export function useNoteInfiniteScroll({ root, enabled, loadMore }: {
  root: RefObject<HTMLDivElement | null>; enabled: boolean; loadMore: () => Promise<unknown>;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = sentinel.current;
    if (!enabled || !target || !root.current) return;
    let requested = false;
    const observer = new IntersectionObserver(entries => {
      if (!requested && entries.some(entry => entry.isIntersecting)) {
        requested = true;
        void loadMore();
      }
    }, { root: root.current, rootMargin: '0px 0px 240px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [root, enabled, loadMore]);
  return sentinel;
}
