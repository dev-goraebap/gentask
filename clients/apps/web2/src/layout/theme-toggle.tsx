import { Button } from '@astryxdesign/core';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Media = 'light' | 'dark';

const KEY = 'astryx-media';

/**
 * Astryx 는 data-astryx-media 로 명암을 가른다. 고른 것은 이 기기에만 남으므로
 * localStorage 에 둔다. 값이 없으면 운영체제 설정을 따른다.
 */
function systemMedia(): Media {
  return globalThis.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeToggle() {
  const [media, setMedia] = useState<Media | null>(null);

  useEffect(() => {
    const stored = globalThis.localStorage?.getItem(KEY);
    const initial: Media = stored === 'light' || stored === 'dark' ? stored : systemMedia();
    setMedia(initial);
    document.documentElement.setAttribute('data-astryx-media', initial);
  }, []);

  const flip = () => {
    const next: Media = media === 'light' ? 'dark' : 'light';
    setMedia(next);
    document.documentElement.setAttribute('data-astryx-media', next);
    try {
      globalThis.localStorage?.setItem(KEY, next);
    } catch {
      // 사생활 보호 창에서는 저장하지 못한다. 이번 세션에만 적용한다.
    }
  };

  // 서버가 그린 셸과 어긋나지 않도록 첫 그림에서는 자리를 비운다.
  if (media === null) return null;

  return (
    <Button
      label={media === 'light' ? '어둡게' : '밝게'}
      isIconOnly
      icon={media === 'light' ? <Moon /> : <Sun />}
      variant="ghost"
      size="sm"
      onClick={flip}
    />
  );
}
