import { AccountPage } from '@/pages/account';
import { DrawerPage } from '@/pages/drawer';
import { type IssueView } from '@/pages/issues/list';
import { WorkspaceSettingsPage } from '@/pages/workspaces/settings';
import { WorkspacesPage } from '@/pages/workspaces/list';
import { AppShellLayout } from '@/widgets/app-shell';
import {
    createRootRoute,
    createRoute,
    createRouter,
    redirect
} from '@tanstack/react-router';
import { DocRoute } from './DocRoute';
import { DocsRoute } from './DocsRoute';
import { IssueRoute } from './IssueRoute';
import { IssuesRoute } from './IssuesRoute';
import { MembersRoute } from './MembersRoute';
import { NotesRoute } from './NotesRoute';
import { TasksRoute } from './TasksRoute';

export const rootRoute = createRootRoute({ component: AppShellLayout });

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/projects' });
  },
});

export const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks/$view',
  validateSearch: (search: Record<string, unknown>): { task?: string } => ({
    task: typeof search.task === 'string' ? search.task : undefined,
  }),
  component: TasksRoute,
});

export const notesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notes',
  component: NotesRoute,
});

export const noteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notes/$noteId',
  component: NotesRoute,
});

export const issuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/issues',
  validateSearch: (search: Record<string, unknown>): { view?: IssueView } => {
    const v = search.view;
    return { view: v === 'tree' || v === 'board' ? v : undefined };
  },
  component: IssuesRoute,
});

export const issueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/issues/$itemId',
  component: IssueRoute,
});

export const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/docs',
  validateSearch: (search: Record<string, unknown>): { folder?: string } => ({
    folder: typeof search.folder === 'string' ? search.folder : undefined,
  }),
  component: DocsRoute,
});

export const docRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/docs/$docId',
  component: DocRoute,
});



export const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/members',
  validateSearch: (search: Record<string, unknown>): { invite?: string } => ({
    invite: typeof search.invite === 'string' ? search.invite : undefined,
  }),
  component: MembersRoute,
});

export const drawerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/drawer', component: DrawerPage });

export const projectsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects', component: WorkspacesPage });

export const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects/$projectId/settings', component: WorkspaceSettingsPage });

export const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me', component: AccountPage });

export const routeTree = rootRoute.addChildren([
  accountRoute,
  drawerRoute,
  projectsRoute,
  settingsRoute,
  membersRoute,
  indexRoute,
  tasksRoute,
  notesRoute,
  noteRoute,
  issuesRoute,
  issueRoute,
  docsRoute,
  docRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
