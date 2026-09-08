import { HgiMoon, HgiSun } from '@/shared/ui/icons';
import { Button } from '@astryxdesign/core';
import { useEffect, useState } from 'react';
import { type Media, MEDIA_KEY } from './app-shell';

export function ThemeToggle() {
  const [media, setMedia] = useState<Media>('light');

  useEffect(() => {
    const current = document.body.getAttribute(`data-${MEDIA_KEY}`);
    if (current === 'light' || current === 'dark') setMedia(current);
  }, []);

  const flip = () => {
    const next: Media = media === 'light' ? 'dark' : 'light';
    setMedia(next);
    document.body.setAttribute(`data-${MEDIA_KEY}`, next);
    document.getElementById('app-favicon')?.setAttribute('href', `/brand/favicon-${next}.svg`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#11120e' : '#f5f5ef');
    try {
      localStorage.setItem(MEDIA_KEY, next);
    } catch {
      // 사생활 보호 창에서는 저장하지 못한다. 이번 세션에만 적용한다.
    }
  };

  return (
    <Button
      label={media === 'light' ? '어둡게' : '밝게'}
      isIconOnly
      icon={media === 'light' ? <HgiMoon /> : <HgiSun />}
      variant="ghost"
      size="sm"
      onClick={flip}
    />
  );
}
