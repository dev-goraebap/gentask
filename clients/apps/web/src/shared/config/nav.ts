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
 * <p>넓은 화면의 사이드바와 좁은 화면의 더보기가 함께 쓴다. 두 곳에 각각 적으면 하나를 더할 때
 * 한쪽만 늘어난다.
 */
export const MORE_NAV_ITEMS: readonly NavItem[] = [
  { label: '팻 관리', icon: 'hgiCat', link: ROUTES.pets() },
  { label: '뽀모도로', icon: 'hgiTimer', link: ROUTES.pomodoro() },
];

/**
 * 좁은 화면의 더보기가 여는 것들.
 *
 * <p>바닥의 띠에는 자주 오가는 셋만 두고 나머지가 이 자리로 온다. 계정이 여기 있는 것은 그것이
 * 모드에 매이지 않기 때문이며, 띠에 넣으면 모드마다 한 칸을 그것에 내주게 된다.
 */
export const MORE_SHEET_ITEMS: readonly NavItem[] = [
  ...MORE_NAV_ITEMS,
  { label: '계정', icon: 'hgiUser', link: ROUTES.account() },
];

/** 프로젝트들로 가는 자리. 사이드바와 바닥의 띠가 같은 것을 가리켜야 하므로 한 곳에서 만든다. */
export const PROJECTS_NAV_ITEM: NavItem = {
  label: '프로젝트',
  icon: 'hgiLayers',
  link: ROUTES.projects(),
};

/**
 * 좁은 화면 바닥의 띠.
 *
 * <p>자리마다 담기는 것이 다르고 마지막 칸은 언제나 더보기다. 그 칸은 주소를 갖지 않으므로 여기에
 * 담기지 않는다 — 띠를 그리는 쪽이 붙인다.
 *
 * <p>넷을 넘기지 않는다. 좁은 화면에서 다섯 칸이 되면 글자가 접히거나 잘린다.
 */
export const TODO_BOTTOM_NAV: readonly NavItem[] = [
  { label: '작업', icon: 'hgiTask', link: ROUTES.taskList('my-day') },
  { label: '메모', icon: 'hgiNote', link: ROUTES.memos() },
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
      // 투두 자리와 같은 이름을 첫머리에 둔다. 자리가 갈려도 메뉴의 골격은 하나여야 한다.
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
