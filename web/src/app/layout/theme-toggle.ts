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

/**
 * 색상 모드를 순환 전환합니다.
 *
 * 세 상태를 버튼 하나로 도는 방식은 다음에 무엇이 오는지 보이지 않는 것이 약점입니다.
 * 그래서 접근 가능한 이름에 현재 상태와 다음 상태를 함께 담습니다. 아이콘만으로 동작을
 * 표현하는 버튼은 이름을 가져야 한다는 13-accessibility.md 3절의 요구이기도 합니다.
 *
 * 메뉴로 펼치는 편이 예측 가능하지만 그러려면 오버레이 컴포넌트를 들여야 합니다.
 * 항목이 셋뿐이라 지금은 순환으로 두고, 모드 외에 고를 것이 늘면 그때 바꿉니다.
 */
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
