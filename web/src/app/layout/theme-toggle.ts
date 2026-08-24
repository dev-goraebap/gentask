import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideMonitor, lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { ThemeStore, type ThemePreference } from '../theme';

const LABEL: Record<ThemePreference, string> = {
  system: '시스템 설정',
  light: '라이트',
  dark: '다크',
};

const ICON: Record<ThemePreference, string> = {
  system: 'lucideMonitor',
  light: 'lucideSun',
  dark: 'lucideMoon',
};

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

@Component({
  selector: 'app-theme-toggle',
  imports: [HlmButton, AppIcon],
  providers: [provideIcons({ lucideMonitor, lucideMoon, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      hlmBtn
      variant="ghost"
      size="icon-sm"
      type="button"
      [attr.aria-label]="label()"
      (click)="theme.cycle()"
    >
      <app-icon [name]="icon()" />
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeStore);

  protected readonly icon = computed(() => ICON[this.theme.preference()]);

  protected readonly label = computed(() => {
    const current = this.theme.preference();
    return `색상 모드: ${LABEL[current]}. 눌러서 ${LABEL[NEXT[current]]}(으)로 전환합니다`;
  });
}
