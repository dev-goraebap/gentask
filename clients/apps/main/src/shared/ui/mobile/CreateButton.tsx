import { HgiPlus } from '@/shared/ui/icons';
import { Button } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { MOBILE_QUERY } from './helpers';

export function CreateButton({ label, onClick }: { label: string; onClick: () => void }) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  return <Button label={label} icon={<HgiPlus />} variant="primary" size={mobile ? 'lg' : 'sm'}
    isIconOnly={mobile} elevation={mobile ? 'med' : 'none'} onClick={onClick}
    style={mobile ? { position: 'fixed', insetInlineEnd: 'var(--spacing-4)', width: 'var(--spacing-12)', height: 'var(--spacing-12)', bottom: 'calc(var(--mobile-nav-height) + var(--spacing-4) + env(safe-area-inset-bottom))', zIndex: 5 } : undefined} />;
}
