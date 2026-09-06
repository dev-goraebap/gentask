import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { loadSession } from '@/entities/session';
import { AppShell } from '@/layout/app-shell';
import { PERSONAL_NAV_GROUPS, TODO_BOTTOM_NAV } from '@/shared/config/nav';
import { ROUTES } from '@/shared/config/routes';

/**
 * 개인 영역. 로그인한 사람만 지난다.
 *
 * 경로를 갖지 않는 레이아웃이므로 주소에 나타나지 않는다. `/me` 와 `/todo/...` 가 이 아래에 선다.
 */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const me = await loadSession();
    if (!me) {
      throw redirect({ to: ROUTES.login(), search: { redirect: location.href } });
    }
    return { me };
  },
  component: AppLayout,
});

function AppLayout() {
  const { me } = Route.useRouteContext();

  return (
    <AppShell
      navGroups={PERSONAL_NAV_GROUPS}
      bottomNav={TODO_BOTTOM_NAV}
      me={me}
      heading={
        <span className="top-logo narrow-only">
          <img src="/icon-192.png" alt="" width={24} height={24} />
          <span className="app-logo">Gentask</span>
        </span>
      }
    >
      <Outlet />
    </AppShell>
  );
}
