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

/**
 * 메뉴의 묶음.
 *
 * <p>항목이 늘면서 무엇이 무엇과 한 갈래인지가 목록만으로는 드러나지 않는다. 라벨을 얹어 갈래를
 * 보이게 하고, 라벨이 없는 묶음은 이름 없이 항목만 그린다.
 */
export interface NavGroup {
  readonly label?: string;
  readonly items: readonly NavItem[];
}

/**
 * 트래커 자리의 메뉴. 다루는 것이 먼저 서고 다스리는 것이 라벨을 달고 뒤에 선다.
 *
 * <p>링크가 프로젝트를 담으므로 상수가 아니라 지금 프로젝트에서 만든다. 넓은 화면의 사이드바와
 * 좁은 화면의 프로젝트 메뉴가 함께 쓴다 — 두 곳에 각각 적으면 하나를 더할 때 한쪽만 늘어난다.
 */
export function trackerNavGroups(projectId: string): readonly NavGroup[] {
  return [
    {
      // 라벨을 두지 않는다. 담긴 둘이 이 자리의 전부이므로 갈래를 이름으로 가를 것이 없다.
      items: [
        { label: '작업 아이템', icon: 'hgiLayers', link: ROUTES.issues(projectId) },
        { label: '문서', icon: 'hgiBook', link: ROUTES.docs(projectId) },
      ],
    },
    {
      label: '관리',
      items: [
        { label: '프로젝트 설정', icon: 'hgiSettings', link: ROUTES.projectSettings(projectId) },
      ],
    },
  ];
}
