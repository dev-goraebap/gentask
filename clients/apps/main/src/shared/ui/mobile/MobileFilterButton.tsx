import { Button } from '@astryxdesign/core';
import { HgiFilter } from '@/shared/ui/icons';

export function MobileFilterButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return <Button label={active ? '필터 (적용 중)' : '필터'} icon={<HgiFilter />} isIconOnly
    size="lg" variant={active ? 'primary' : 'secondary'} onClick={onClick} />;
}
