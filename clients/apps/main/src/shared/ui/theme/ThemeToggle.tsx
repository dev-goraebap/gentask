import { HgiMoon, HgiSun } from '@/shared/ui/icons';
import { Button } from '@astryxdesign/core';
import { useAppearance } from './useAppearance';

export function ThemeToggle() {
  const { media, change } = useAppearance();
  return <Button
    label={media === 'light' ? '어둡게' : '밝게'}
    isIconOnly
    icon={media === 'light' ? <HgiMoon /> : <HgiSun />}
    variant="ghost"
    size="sm"
    onClick={() => change({ media: media === 'light' ? 'dark' : 'light' })}
  />;
}
