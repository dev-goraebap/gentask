export function BrandMark({ size = 44 }: { size?: number }) {
  return <svg role="img" aria-label="Gentask" viewBox="0 0 512 512" width={size} height={size}
    style={{ display: 'block', width: `${size / 16}rem`, height: `${size / 16}rem`, flexShrink: 0, fill: 'var(--color-icon-accent)' }}>
    <use href="/brand/gentask-symbol.svg#gentask-mark" />
  </svg>;
}
