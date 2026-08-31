import type { IconName } from '@/shared/ui/icon';
import { ROUTES } from './routes';

export interface NavItem {
  readonly label: string;
  readonly icon: IconName;
  readonly link: string;
}

/**
 * 작업 밖의 자리들.
 *
 * <p>넓은 화면의 사이드바와 좁은 화면의 목록들이 함께 쓴다. 두 곳에 각각 적으면 하나를 더할 때
 * 한쪽만 늘어난다.
 */
export const MORE_NAV_ITEMS: readonly NavItem[] = [
  { label: '팻 관리', icon: 'hgiCat', link: ROUTES.pets() },
  { label: '뽀모도로', icon: 'hgiTimer', link: ROUTES.pomodoro() },
];
