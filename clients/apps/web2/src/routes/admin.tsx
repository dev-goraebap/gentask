import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { loadSession } from '@/entities/session';
import { AppShell } from '@/layout/app-shell';
import { ADMIN_NAV_GROUPS } from '@/shared/config/nav';
import { ROUTES } from '@/shared/config/routes';

/**
 * 관리 영역. 메뉴 구성만 다르고 나머지는 같으므로 껍데기를 복제하지 않는다.
 */
export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    const me = await loadSession();
    if (!me) throw redirect({ to: ROUTES.login(), search: { redirect: location.href } });
    if (me.role !== 'ADMIN') throw redirect({ to: ROUTES.home() });
    return { me };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { me } = Route.useRouteContext();

  return (
    <AppShell navGroups={ADMIN_NAV_GROUPS} heading="관리" me={me}>
      <Outlet />
    </AppShell>
  );
}
