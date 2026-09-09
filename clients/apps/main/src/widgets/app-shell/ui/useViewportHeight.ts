import { useEffect, useState } from 'react';
export function useViewportHeight(enabled: boolean) {
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    if (!enabled) return;
    const viewport = window.visualViewport;
    const resize = () => setHeight(viewport?.height ?? window.innerHeight);
    resize();
    viewport?.addEventListener('resize', resize);
    return () => viewport?.removeEventListener('resize', resize);
  }, [enabled]);
  return enabled && height ? height : undefined;
}
