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
 * 넓은 화면의 사이드바와 좁은 화면의 더보기가 함께 쓴다. 두 곳에 각각 적으면 하나를 더할 때
 * 한쪽만 늘어난다.
 */
export const MORE_NAV_ITEMS: readonly NavItem[] = [
  { label: '팻 관리', icon: 'hgiCat', link: ROUTES.pets() },
  { label: '뽀모도로', icon: 'hgiTimer', link: ROUTES.pomodoro() },
];

/**
 * 좁은 화면의 더보기가 여는 것들.
 *
 * 바닥의 띠에는 자주 오가는 셋만 두고 나머지가 이 자리로 온다. 계정이 여기 있는 것은 그것이
 * 모드에 매이지 않기 때문이며, 띠에 넣으면 모드마다 한 칸을 그것에 내주게 된다.
 */
export const MORE_SHEET_ITEMS: readonly NavItem[] = [
  ...MORE_NAV_ITEMS,
  { label: '계정', icon: 'hgiUser', link: ROUTES.account() },
];

/** 프로젝트 목록 네비게이션 항목이다. 사이드바와 하단 탭 바에서 공통 사용한다. */
export const PROJECTS_NAV_ITEM: NavItem = {
  label: '프로젝트',
  icon: 'hgiLayers',
  link: ROUTES.projects(),
};

/**
 * 모바일 하단 탭 바 네비게이션 아이템 목록이다(최대 4개 권장).
 */
export const TODO_BOTTOM_NAV: readonly NavItem[] = [
  { label: '작업', icon: 'hgiCheckCircle', link: ROUTES.taskList('my-day') },
  PROJECTS_NAV_ITEM,
];

export function trackerBottomNav(projectId: string): readonly NavItem[] {
  return [
    { label: '작업 아이템', icon: 'hgiLayers', link: ROUTES.issues(projectId) },
    { label: '문서', icon: 'hgiBook', link: ROUTES.docs(projectId) },
    { label: '설정', icon: 'hgiSettings', link: ROUTES.projectSettings(projectId) },
  ];
}

/**
 * 네비게이션 그룹 인터페이스다.
 */
export interface NavGroup {
  readonly label?: string;
  readonly items: readonly NavItem[];
}

/**
 * 트래커 섹션의 네비게이션 메뉴 그룹이다.
 * 사이드바와 모바일 프로젝트 메뉴에서 공통으로 사용한다.
 */
export function trackerNavGroups(projectId: string): readonly NavGroup[] {
  return [
    {
      // 투두 모드와 메뉴 통일성을 유지하기 위해 동일한 명칭을 첫머리에 둔다.
      label: '작업',
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
