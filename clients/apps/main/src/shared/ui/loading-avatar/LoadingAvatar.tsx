import { Avatar, type AvatarProps } from '@astryxdesign/core';
import { useState } from 'react';

export function LoadingAvatar({ src, fallbackSrc, style, onLoadCapture, ...props }: AvatarProps & { fallbackSrc: string }) {
  const [loaded, setLoaded] = useState<string>();
  const source = src || fallbackSrc;
  return <Avatar {...props} src={source} fallbackSrc={fallbackSrc}
    style={{ ...style, backgroundImage: loaded === source ? style?.backgroundImage : `url("${fallbackSrc}")`,
      backgroundSize: 'cover', backgroundPosition: 'center' }}
    onLoadCapture={event => {
      if (event.target instanceof HTMLImageElement && event.target.getAttribute('src') === source) setLoaded(source);
      onLoadCapture?.(event);
    }} />;
}
