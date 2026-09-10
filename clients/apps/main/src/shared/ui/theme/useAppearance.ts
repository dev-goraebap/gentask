import { useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  window.addEventListener('gentask-appearance-applied', callback);
  return () => window.removeEventListener('gentask-appearance-applied', callback);
};

export function useAppearance() {
  const palette = useSyncExternalStore(subscribe, () => document.body.getAttribute('data-gentask-palette') ?? 'neutral', () => 'neutral');
  const media = useSyncExternalStore(subscribe, () => document.body.getAttribute('data-astryx-media') ?? 'light', () => 'light');
  const change = (detail: { palette?: string; media?: 'light' | 'dark' }) => {
    window.dispatchEvent(new CustomEvent('gentask-appearance-change', { detail }));
  };
  return { palette, media, change };
}
