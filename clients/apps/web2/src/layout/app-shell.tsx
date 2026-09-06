import {
  AppShell as AstryxAppShell,
  Avatar,
  BottomSheet,
  SideNav,
  SideNavItem,
  SideNavSection,
  Text,
  TopNav,
} from '@astryxdesign/core';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { MoreHorizontal } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { logout } from '@/entities/session';
import type { MeView } from '@/shared/api/client';
import { MORE_SHEET_ITEMS, type NavGroup, type NavItem } from '@/shared/config/nav';
import { ROUTES } from '@/shared/config/routes';
import { ThemeToggle } from './theme-toggle';

interface AppShellProps {
  readonly navGroups: readonly NavGroup[];
  /** 좁은 화면 아래에 깔리는 띠. 두지 않으면 그 자리는 넓은 화면 전용이 된다. */
  readonly bottomNav?: readonly NavItem[];
  readonly heading: ReactNode;
  /** 사이드바 머리 아래에 서는 것. 트래커는 여기에 프로젝트 고르개를 둔다. */
  readonly sidebarLead?: ReactNode;
  readonly me?: MeView | null;
  readonly children: ReactNode;
}

/**
 * 세 영역(개인 · 트래커 · 관리)이 같은 껍데기를 쓴다. 메뉴와 머리글만 갈아 끼운다.
 *
 * 좁은 화면에서는 사이드바를 드로어로 바꾸지 않고 아예 걷는다. 그 자리의 이동은 바닥의 띠가
 * 맡으며, 띠에 들어가지 않는 것은 더보기가 시트로 연다. web 과 같은 구성이다.
 */
export function AppShell({
  navGroups,
  bottomNav,
  heading,
  sidebarLead,
  me,
  children,
}: AppShellProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);

  const isCurrent = (link: string) => pathname === link || pathname.startsWith(`${link}/`);

  const go = (link: string) => (event?: React.MouseEvent) => {
    event?.preventDefault();
    setMoreOpen(false);
    void navigate({ to: link });
  };

  return (
    <AstryxAppShell
      height="fill"
      variant="section"
      contentPadding={0}
      // 좁은 화면에는 드로어를 두지 않는다. 바닥의 띠가 그 일을 한다.
      mobileNav={false}
      topNav={<TopNav heading={heading} label="주 내비게이션" endContent={<ThemeToggle />} />}
      sideNav={
        <SideNav
          header={
            <button type="button" className="side-logo" onClick={go(ROUTES.home())}>
              <img src="/icon-192.png" alt="" width={24} height={24} />
              <span className="app-logo">Gentask</span>
            </button>
          }
          footer={
            me ? (
              <button type="button" className="side-account" onClick={go(ROUTES.account())}>
                <Avatar name={me.nickname} src={me.profileImageUrl ?? undefined} size="sm" />
                <Text as="span">{me.nickname}</Text>
              </button>
            ) : undefined
          }
        >
          {sidebarLead ? <div className="sidebar-lead">{sidebarLead}</div> : null}

          {navGroups.map((group, index) => {
            const items = group.items.map((item) => (
              <SideNavItem
                key={item.link}
                label={item.label}
                icon={item.icon}
                href={item.link}
                isSelected={isCurrent(item.link)}
                onClick={go(item.link)}
              />
            ));

            /*
             * 라벨이 있는 묶음은 SideNavSection 이 받는다. SideNavHeading 은 사이드바 머리
             * 슬롯의 것이라 묶음 라벨로 쓰면 글자가 크게 선다.
             */
            return group.label ? (
              <SideNavSection key={group.label} title={group.label}>
                {items}
              </SideNavSection>
            ) : (
              <div key={`group-${index}`}>{items}</div>
            );
          })}
        </SideNav>
      }
    >
      {children}

      {bottomNav ? (
        <nav className="bottom-nav" aria-label="바로 가기">
          {bottomNav.map((item) => (
            <button
              key={item.link}
              type="button"
              className={isCurrent(item.link) ? 'current' : undefined}
              aria-current={isCurrent(item.link) ? 'page' : undefined}
              onClick={go(item.link)}
            >
              <item.icon aria-hidden />
              <span>{item.label}</span>
            </button>
          ))}
          <button type="button" onClick={() => setMoreOpen(true)}>
            <MoreHorizontal aria-hidden />
            <span>더보기</span>
          </button>
        </nav>
      ) : null}

      <BottomSheet label="더보기" isOpen={moreOpen} onOpenChange={setMoreOpen}>
        <div className="more-sheet">
          {MORE_SHEET_ITEMS.map((item) => (
            <button key={item.link} type="button" onClick={go(item.link)}>
              <item.icon aria-hidden />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              void logout().then(() => navigate({ to: ROUTES.login() }));
            }}
          >
            <span>로그아웃</span>
          </button>
        </div>
      </BottomSheet>
    </AstryxAppShell>
  );
}
