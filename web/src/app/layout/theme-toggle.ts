import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService, type ThemePreference } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon, type IconName } from '@/shared/ui/icon';

const LABEL: Record<ThemePreference, string> = {
  system: '시스템 설정',
  light: '라이트',
  dark: '다크',
};

const ICON: Record<ThemePreference, IconName> = {
  system: 'hgiMonitor',
  light: 'hgiSun',
  dark: 'hgiMoon',
};

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

@Component({
  selector: 'app-theme-toggle',
  imports: [HlmButton, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly themeService = inject(ThemeService);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly icon = computed(() => ICON[this.themeService.preference()]);

  protected readonly label = computed(() => {
    const current = this.themeService.preference();
    return `색상 모드: ${LABEL[current]}. 눌러서 ${LABEL[NEXT[current]]}(으)로 전환합니다`;
  });
}
