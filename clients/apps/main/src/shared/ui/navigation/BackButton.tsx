import { HgiArrowLeft } from '@/shared/ui/icons';
import { Button } from '@astryxdesign/core';

export function BackButton({ label = '목록으로', onClick, size = 'sm' }: {
  label?: string; onClick: () => void; size?: 'sm' | 'lg';
}) {
  return <Button label={label} icon={<HgiArrowLeft size={size === 'lg' ? 24 : 20} />} isIconOnly size={size} variant="ghost"
    style={{ flexShrink: 0, marginInlineStart: size === 'lg' ? 'calc(-1 * var(--spacing-2))' : 'calc(-1 * var(--spacing-1))' }} onClick={onClick} />;
}
