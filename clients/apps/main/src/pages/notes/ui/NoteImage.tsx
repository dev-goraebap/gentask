import { Text, VStack } from '@astryxdesign/core';
import { useCallback, useState } from 'react';

const displayedSources = new Set<string>();
function rememberSource(src: string) {
  displayedSources.delete(src);
  displayedSources.add(src);
  if (displayedSources.size > 256) displayedSources.delete(displayedSources.values().next().value!);
}

export function NoteImage({ src, alt, color, width, height, square = false }: {
  src?: string; alt: string; color?: string | null; width?: number | null; height?: number | null; square?: boolean;
}) {
  const [loaded, setLoaded] = useState<{ src: string; animate: boolean }>();
  const imageRef = useCallback((element: HTMLImageElement | null) => {
    if (src && element?.complete && element.naturalWidth) {
      rememberSource(src);
      setLoaded({ src, animate: false });
    }
  }, [src]);
  const [failed, setFailed] = useState<string>();
  const ready = Boolean(src && loaded?.src === src);
  const ratio = width && height ? `${width} / ${height}` : ready ? undefined : '16 / 9';
  return <VStack className="note-image" align="center" justify="center"
    style={{ backgroundColor: color ?? 'var(--color-background-muted)', aspectRatio: square ? '1' : ratio }}>
    {src && failed !== src ? <img src={src} alt={alt} loading="lazy" decoding="async"
      width={width ?? undefined} height={height ?? undefined}
      className={square ? 'note-image-content note-image-square' : 'note-image-content note-card-image'}
      style={{ opacity: ready ? 1 : 0, transition: ready && !loaded?.animate ? 'none' : undefined }}
      ref={imageRef}
      onLoad={() => {
        const animate = !displayedSources.has(src);
        rememberSource(src);
        setLoaded(current => current?.src === src ? current : { src, animate });
      }} onError={() => setFailed(src)} /> :
      <Text type="supporting">이미지 미리보기 없음</Text>}
  </VStack>;
}
