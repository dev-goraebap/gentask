import { InvitationRoute } from './InvitationRoute';
import { stripSearchParams, type SearchSchemaInput } from '@tanstack/react-router';
import { parseListingSearch, type ListingSearch } from '@/shared/ui/listing';
import type { QueryClient } from '@tanstack/react-query';
import { sessionOptions } from '@/entities/session';
import { projectsOptions } from '@/entities/workspace';
import { artifactsOptions, artifactOptions, foldersOptions, parseVersionSearch } from '@/entities/artifact';
import { ApiError } from '@/shared/api';
import { UnavailablePage } from '@/pages/unavailable';
import { RootLayout } from './RootLayout';
import { LoginRoute } from './LoginRoute';
import { RouteError } from './RouteError';
import { RoutePending } from './RoutePending';
import { queryClient, onSessionExpired } from '../model/query-client';
import { AccountPage } from '@/pages/account';
import { TasksComingSoonPage } from '@/pages/tasks-coming-soon';
import { PersonalArtifactsRoute } from './PersonalArtifactsRoute';
import { PersonalArtifactRoute } from './PersonalArtifactRoute';
import { type IssueView } from '@/pages/issues/list';
import { WorkspaceSettingsPage } from '@/pages/workspaces/settings';
import { WorkspacesPage } from '@/pages/workspaces/list';
import { AppShellLayout } from '@/widgets/app-shell';
import {
    createRootRouteWithContext,
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

export const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === '/login' || location.pathname.startsWith('/invitations/')) return;
    try { await context.queryClient.fetchQuery(sessionOptions()); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) throw redirect({ to: '/login', replace: true });
      throw error;
    }
  },
});
export const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', validateSearch: (search: Record<string, unknown>): { invite?: string } => ({ invite: typeof search.invite === 'string' ? search.invite : undefined }), component: LoginRoute });


export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/tasks' });
  },
});

export const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks/$view',
  validateSearch: (search: Record<string, unknown>): { task?: string } => ({
    task: typeof search.task === 'string' ? search.task : undefined,
  }),
  component: TasksComingSoonPage,
});

export const personalTasksRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tasks', component: TasksComingSoonPage });
export const projectTasksRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects/$projectId/tasks', component: TasksComingSoonPage });
export const personalArtifactsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/artifacts', component: PersonalArtifactsRoute,
  validateSearch: (search: Partial<ListingSearch> & { folder?: string } & SearchSchemaInput) => ({ ...parseListingSearch(search, ['title', 'updated'], 'title'), folder: typeof search.folder === 'string' ? search.folder : undefined }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData({ ...artifactsOptions(null), revalidateIfStale: true }), context.queryClient.ensureQueryData({ ...foldersOptions(null), revalidateIfStale: true })]),
});
export const personalArtifactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/artifacts/$docId', component: PersonalArtifactRoute,
  validateSearch: (search: Partial<ListingSearch> & { version?: number | string } & SearchSchemaInput) => ({ ...parseListingSearch(search, ['title', 'updated'], 'title'), version: parseVersionSearch(search.version) }),
  search: { middlewares: [stripSearchParams({ q: '', sort: 'title', direction: 'asc', page: 1, size: 25 })] },
  loader: ({ context, params }) => context.queryClient.ensureQueryData({ ...artifactOptions(null, params.docId), revalidateIfStale: true }),
});

export const notesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notes',
  component: UnavailablePage,
});

export const noteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notes/$noteId',
  component: UnavailablePage,
});

export const issuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/issues',
  validateSearch: (search: Record<string, unknown>): { view?: IssueView } => {
    const v = search.view;
    return { view: v === 'tree' || v === 'board' ? v : undefined };
  },
  component: UnavailablePage,
});

export const issueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/issues/$itemId',
  component: UnavailablePage,
});

export const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/artifacts',
  validateSearch: (search: Partial<ListingSearch> & { folder?: string } & SearchSchemaInput) => ({
    ...parseListingSearch(search, ['title', 'updated'], 'title'),
    folder: typeof search.folder === 'string' ? search.folder : undefined,
  }),
  loader: ({ context, params }) => Promise.all([
    context.queryClient.ensureQueryData({ ...artifactsOptions(params.projectId), revalidateIfStale: true }),
    context.queryClient.ensureQueryData({ ...foldersOptions(params.projectId), revalidateIfStale: true }),
  ]),
  component: DocsRoute,
});

export const docRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/artifacts/$docId',
  validateSearch: (search: Partial<ListingSearch> & { version?: number | string } & SearchSchemaInput) => ({
    ...parseListingSearch(search, ['title', 'updated'], 'title'),
    version: parseVersionSearch(search.version),
  }),
  search: { middlewares: [stripSearchParams({ q: '', sort: 'title', direction: 'asc', page: 1, size: 25 })] },
  loader: ({ context, params }) => context.queryClient.ensureQueryData({ ...artifactOptions(params.projectId, params.docId), revalidateIfStale: true }),
  component: DocRoute,
});

const legacyDocsRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/projects/$projectId/docs',
  validateSearch: (search: Record<string, unknown>) => ({ folder: typeof search.folder === 'string' ? search.folder : undefined }),
  beforeLoad: ({ params, search }) => { throw redirect({ to: '/projects/$projectId/artifacts', params, search, replace: true }); },
});
const legacyDocRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/projects/$projectId/docs/$docId',
  beforeLoad: ({ params }) => { throw redirect({ to: '/projects/$projectId/artifacts/$docId', params, replace: true }); },
});
const legacyDiscoveriesRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/projects/$projectId/discoveries',
  beforeLoad: ({ params }) => { throw redirect({ to: '/projects/$projectId/artifacts', params, search: params.projectId === 'gentask' ? { folder: 'discoveries' } : {}, replace: true }); },
});
const legacyDiscoveryRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/projects/$projectId/discoveries/$discoveryId',
  beforeLoad: ({ params }) => { throw redirect({ to: '/projects/$projectId/artifacts/$docId', params: { projectId: params.projectId, docId: params.discoveryId }, replace: true }); },
});



export const invitationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/invitations/$token', component: InvitationRoute });
export const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/members',
  validateSearch: (search: Record<string, unknown>): { invite?: string } => ({
    invite: typeof search.invite === 'string' ? search.invite : undefined,
  }),
  component: MembersRoute,
});


export const projectsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects', validateSearch: (search: Partial<ListingSearch> & SearchSchemaInput) => parseListingSearch(search, ['manual', 'name'], 'manual'), component: WorkspacesPage, loader: ({ context }) => context.queryClient.ensureQueryData({ ...projectsOptions(), revalidateIfStale: true }) });

export const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects/$projectId/settings', component: WorkspaceSettingsPage });

export const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me', component: AccountPage });

export const routeTree = rootRoute.addChildren([
  loginRoute, invitationRoute,
  legacyDocsRoute,
  legacyDocRoute,
  legacyDiscoveriesRoute,
  legacyDiscoveryRoute,
  accountRoute,
  personalTasksRoute,
  projectTasksRoute,
  personalArtifactsRoute,
  personalArtifactRoute,
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

export const router = createRouter({ routeTree, context: { queryClient }, defaultPreloadStaleTime: 0, defaultErrorComponent: RouteError, defaultPendingComponent: RoutePending });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

let expiring = false;
onSessionExpired(() => {
  if (expiring || router.state.location.pathname === '/login') return;
  expiring = true;
  void queryClient.cancelQueries().then(() => {
    queryClient.clear();
    return router.navigate({ to: '/login', search: { invite: router.state.location.pathname.startsWith('/invitations/') ? router.state.location.pathname.split('/')[2] : undefined }, replace: true });
  }).finally(() => { expiring = false; });
});
