import AlarmClockIcon from '@hugeicons/core-free-icons/AlarmClockIcon';
import ArrowDataTransferVerticalIcon from '@hugeicons/core-free-icons/ArrowDataTransferVerticalIcon';
import ArrowDown01Icon from '@hugeicons/core-free-icons/ArrowDown01Icon';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon';
import ArrowRightDoubleIcon from '@hugeicons/core-free-icons/ArrowRightDoubleIcon';
import ArrowUp01Icon from '@hugeicons/core-free-icons/ArrowUp01Icon';
import Attachment01Icon from '@hugeicons/core-free-icons/Attachment01Icon';
import Bookmark01Icon from '@hugeicons/core-free-icons/Bookmark01Icon';
import BookOpen01Icon from '@hugeicons/core-free-icons/BookOpen01Icon';
import Bug01Icon from '@hugeicons/core-free-icons/Bug01Icon';
import Calendar01Icon from '@hugeicons/core-free-icons/Calendar01Icon';
import Calendar02Icon from '@hugeicons/core-free-icons/Calendar02Icon';
import Calendar03Icon from '@hugeicons/core-free-icons/Calendar03Icon';
import CalendarCheckIn01Icon from '@hugeicons/core-free-icons/CalendarCheckIn01Icon';
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon';
import CatIcon from '@hugeicons/core-free-icons/CatIcon';
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon';
import CircleArrowRight01Icon from '@hugeicons/core-free-icons/CircleArrowRight01Icon';
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon';
import ComputerIcon from '@hugeicons/core-free-icons/ComputerIcon';
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon';
import File01Icon from '@hugeicons/core-free-icons/File01Icon';
import FilterIcon from '@hugeicons/core-free-icons/FilterIcon';
import FlashIcon from '@hugeicons/core-free-icons/FlashIcon';
import Folder01Icon from '@hugeicons/core-free-icons/Folder01Icon';
import GitBranchIcon from '@hugeicons/core-free-icons/GitBranchIcon';
import GithubIcon from '@hugeicons/core-free-icons/GithubIcon';
import Home01Icon from '@hugeicons/core-free-icons/Home01Icon';
import InformationCircleIcon from '@hugeicons/core-free-icons/InformationCircleIcon';
import Layers01Icon from '@hugeicons/core-free-icons/Layers01Icon';
import Link01Icon from '@hugeicons/core-free-icons/Link01Icon';
import Loading03Icon from '@hugeicons/core-free-icons/Loading03Icon';
import Menu01Icon from '@hugeicons/core-free-icons/Menu01Icon';
import Moon02Icon from '@hugeicons/core-free-icons/Moon02Icon';
import MoreHorizontalIcon from '@hugeicons/core-free-icons/MoreHorizontalIcon';
import Note01Icon from '@hugeicons/core-free-icons/Note01Icon';
import NotificationOff01Icon from '@hugeicons/core-free-icons/NotificationOff01Icon';
import OctagonXIcon from '@hugeicons/core-free-icons/OctagonXIcon';
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon';
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon';
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon';
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon';
import SidebarLeft01Icon from '@hugeicons/core-free-icons/SidebarLeft01Icon';
import SidebarLeftIcon from '@hugeicons/core-free-icons/SidebarLeftIcon';
import StarIcon from '@hugeicons/core-free-icons/StarIcon';
import Sun03Icon from '@hugeicons/core-free-icons/Sun03Icon';
import Task01Icon from '@hugeicons/core-free-icons/Task01Icon';
import TerminalIcon from '@hugeicons/core-free-icons/TerminalIcon';
import Timer01Icon from '@hugeicons/core-free-icons/Timer01Icon';
import Tick02Icon from '@hugeicons/core-free-icons/Tick02Icon';
import TriangleAlertIcon from '@hugeicons/core-free-icons/TriangleAlertIcon';
import UserCircleIcon from '@hugeicons/core-free-icons/UserCircleIcon';
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon';

/**
 * Huge Icons 를 @ng-icons 가 읽는 형태로 옮긴다.
 *
 * <p>웹폰트가 아니라 SVG 로 둔다. 폰트는 전체 세트가 660KB 이고 우리가 쓰는 것은 서른몇 개뿐이며,
 * 글리프가 코드포인트라 폰트가 도착하기 전 한자로 보이는 자리를 따로 가려야 한다. SVG 는 쓰는 것만
 * 번들에 들어가고 그 문제가 없다.
 *
 * <p>이름을 우리 어휘로 다시 짓지 않고 `hgi` 접두어와 원래 이름을 쓴다. 그림을 바꾸려 할 때 어느
 * 아이콘이었는지 찾을 수 있어야 한다.
 *
 * <p>배럴이 아니라 아이콘 파일을 하나씩 가리킨다. 패키지의 진입점은 6천여 개를 다시 내보내며, 그것을
 * 거치면 번들러가 트리 셰이킹을 위해 그 전부를 읽는다. 실측으로 빌드가 152초까지 늘고 esbuild 가
 * 4.5GB 를 물었다.
 */

/** `[태그, 속성]` 짝의 목록. 패키지가 아이콘을 이 형태로 낸다. */
type IconSvgObject = readonly (readonly [string, Readonly<Record<string, string | number>>])[];

/** 그림이 그려지는 자리. Huge Icons 는 24 격자에 1.5 굵기의 선으로 그린다. */
const VIEW_BOX = '0 0 24 24';

const STROKE_WIDTH = '1.5';

function toSvg(icon: IconSvgObject): string {
  const body = icon
    .map(([tag, attrs]) => {
      const 속성 = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return `<${tag} ${속성} />`;
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_BOX}" width="100%" height="100%"` +
    ` fill="none" stroke="currentColor" stroke-width="${STROKE_WIDTH}"` +
    ` stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
  );
}

/**
 * 화면이 부르는 이름과 그림의 대응.
 *
 * <p>`provideIcons` 가 받는 것은 SVG 문자열이므로 여기서 옮겨 담는다.
 */
export const HGI_ICONS = {
  hgiAlarmClock: toSvg(AlarmClockIcon),
  hgiAlert: toSvg(TriangleAlertIcon),
  hgiArrowDown: toSvg(ArrowDown01Icon),
  hgiArrowLeft: toSvg(ArrowLeft01Icon),
  hgiArrowRight: toSvg(ArrowRight01Icon),
  hgiArrowRightDouble: toSvg(ArrowRightDoubleIcon),
  hgiArrowUp: toSvg(ArrowUp01Icon),
  hgiAttachment: toSvg(Attachment01Icon),
  hgiBook: toSvg(BookOpen01Icon),
  hgiBookmark: toSvg(Bookmark01Icon),
  hgiBug: toSvg(Bug01Icon),
  hgiCalendar: toSvg(Calendar01Icon),
  hgiCalendarDue: toSvg(Calendar02Icon),
  hgiCalendarCheck: toSvg(CalendarCheckIn01Icon),
  hgiCalendarRange: toSvg(Calendar03Icon),
  hgiCancel: toSvg(Cancel01Icon),
  hgiCat: toSvg(CatIcon),
  hgiCheck: toSvg(Tick02Icon),
  hgiCheckCircle: toSvg(CheckmarkCircle02Icon),
  hgiCircleArrowRight: toSvg(CircleArrowRight01Icon),
  hgiClock: toSvg(Clock01Icon),
  hgiFile: toSvg(File01Icon),
  hgiFilter: toSvg(FilterIcon),
  hgiFlash: toSvg(FlashIcon),
  hgiFolder: toSvg(Folder01Icon),
  hgiGitBranch: toSvg(GitBranchIcon),
  hgiGithub: toSvg(GithubIcon),
  hgiHome: toSvg(Home01Icon),
  hgiInfo: toSvg(InformationCircleIcon),
  hgiLayers: toSvg(Layers01Icon),
  hgiLink: toSvg(Link01Icon),
  hgiLoading: toSvg(Loading03Icon),
  hgiMenu: toSvg(Menu01Icon),
  hgiMonitor: toSvg(ComputerIcon),
  hgiMoon: toSvg(Moon02Icon),
  hgiMore: toSvg(MoreHorizontalIcon),
  hgiNote: toSvg(Note01Icon),
  hgiNotificationOff: toSvg(NotificationOff01Icon),
  hgiOctagonX: toSvg(OctagonXIcon),
  hgiPlus: toSvg(PlusSignIcon),
  hgiSearch: toSvg(Search01Icon),
  hgiSettings: toSvg(Settings01Icon),
  hgiShield: toSvg(Shield01Icon),
  hgiSidebarClose: toSvg(SidebarLeftIcon),
  hgiSidebarOpen: toSvg(SidebarLeft01Icon),
  hgiSort: toSvg(ArrowDataTransferVerticalIcon),
  hgiStar: toSvg(StarIcon),
  hgiSun: toSvg(Sun03Icon),
  hgiTask: toSvg(Task01Icon),
  hgiTerminal: toSvg(TerminalIcon),
  hgiTimer: toSvg(Timer01Icon),
  hgiTrash: toSvg(Delete02Icon),
  hgiUser: toSvg(UserCircleIcon),
  hgiUsers: toSvg(UserGroupIcon),
} as const;

/** 화면이 쓸 수 있는 아이콘 이름. 없는 이름을 넘기면 컴파일이 막는다. */
export type IconName = keyof typeof HGI_ICONS;
