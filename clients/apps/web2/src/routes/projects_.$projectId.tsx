import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { loadSession } from '@/entities/session';
import { AppShell } from '@/layout/app-shell';
import { api, type ProjectView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { trackerBottomNav, trackerNavGroups } from '@/shared/config/nav';
import { ProjectPicker } from '@/shared/ui/project-picker';
import { ROUTES } from '@/shared/config/routes';

/**
 * 트래커 영역. 개인 영역과 같은 껍데기에 메뉴와 머리글만 갈아 끼운다.
 *
 * 파일 이름의 밑줄은 `/projects` 아래에 겹쳐 서지 않겠다는 표시다. 둘은 서로 다른 껍데기를 쓴다.
 */
export const Route = createFileRoute('/projects_/$projectId')({
  beforeLoad: async ({ location }) => {
    const me = await loadSession();
    if (!me) {
      throw redirect({ to: ROUTES.login(), search: { redirect: location.href } });
    }
    return { me };
  },
  loader: async ({ params }) => ({
    project: await api.get<ProjectView>(ENDPOINTS.project(params.projectId)),
    // 고르개가 갈 수 있는 자리를 함께 받는다. 사이드바에서 프로젝트를 바꿀 수 있어야 한다.
    projects: await api.get<ProjectView[]>(ENDPOINTS.projects),
  }),
  component: TrackerLayout,
});

function TrackerLayout() {
  const { me } = Route.useRouteContext();
  const { project, projects } = Route.useLoaderData();
  const { projectId } = Route.useParams();

  return (
    <AppShell
      navGroups={trackerNavGroups(projectId)}
      bottomNav={trackerBottomNav(projectId)}
      me={me}
      heading={project.name}
      sidebarLead={<ProjectPicker projects={projects} current={project} />}
    >
      <Outlet />
    </AppShell>
  );
}
