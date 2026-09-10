import { ArtifactCreateRoute } from './ArtifactCreateRoute';
import { EditorPlaygroundRoute } from './EditorPlaygroundRoute';
import { RouteNotFound } from './RouteNotFound';
import { parseResourceScope } from '@/shared/config';
import { NotesRoute } from './NotesRoute';
import { InvitationRoute } from './InvitationRoute';
import { stripSearchParams, type SearchSchemaInput } from '@tanstack/react-router';
import { parseListingSearch, type ListingSearch } from '@/shared/ui/listing';
import type { QueryClient } from '@tanstack/react-query';
import { sessionOptions } from '@/entities/session';
import { parseVersionSearch } from '@/entities/artifact';
import { ApiError } from '@/shared/api';
import { UnavailablePage } from '@/pages/unavailable';
import { RootLayout } from './RootLayout';
import { LoginRoute } from './LoginRoute';
import { RouteError } from './RouteError';
import { RoutePending } from './RoutePending';
import { queryClient, onSessionExpired } from '../model/query-client';
import { AccountPage } from '@/pages/account';
import { ArtifactsRoute } from './ArtifactsRoute';
import { ArtifactRoute } from './ArtifactRoute';
import { WorkspaceSettingsPage } from '@/pages/workspaces/settings';
import { WorkspacesPage } from '@/pages/workspaces/list';
import { AppShellLayout } from '@/widgets/app-shell';
import {
    createRootRouteWithContext,
    createRoute,
    createRouter,
    redirect
} from '@tanstack/react-router';
import { MembersRoute } from './MembersRoute';
import { TasksRoute } from './TasksRoute';
import { TaskRoute } from './TaskRoute';

export const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: RouteNotFound,
  validateSearch: parseResourceScope,
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === '/login' || location.pathname.startsWith('/invitations/') || (import.meta.env.DEV && location.pathname === '/playground/editor')) return;
    try { await context.queryClient.ensureQueryData({ ...sessionOptions(), revalidateIfStale: true }); }
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
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/notes', search });
  },
});

export const tasksRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tasks/$taskId', component: TaskRoute });

export const personalTasksRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tasks', component: TasksRoute });
export const projectTasksRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects/$projectId/tasks', beforeLoad: ({ params }) => { throw redirect({ to: '/tasks', search: { projectId: params.projectId }, replace: true }); } });
export const personalArtifactsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/artifacts', component: ArtifactsRoute,
  validateSearch: (search: Partial<ListingSearch> & { folder?: string } & SearchSchemaInput) => ({ ...parseListingSearch(search, ['title', 'updated'], 'title'), folder: typeof search.folder === 'string' ? search.folder : undefined }),
  beforeLoad: ({ search }) => {
    if (!search.projectId && search.scope !== 'personal') throw redirect({ to: '/artifacts', search: { ...search, scope: 'personal' }, replace: true });
  },
});
export const artifactCreateRoute = createRoute({ getParentRoute: () => rootRoute, path: '/artifacts/new', component: ArtifactCreateRoute,
  validateSearch: (search: { folder?: string } & SearchSchemaInput) => ({ folder: typeof search.folder === 'string' ? search.folder : undefined }),
});
export const personalArtifactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/artifacts/$docId', component: ArtifactRoute,
  validateSearch: (search: Partial<ListingSearch> & { version?: number | string } & SearchSchemaInput) => ({ ...parseListingSearch(search, ['title', 'updated'], 'title'), version: parseVersionSearch(search.version) }),
  search: { middlewares: [stripSearchParams({ q: '', sort: 'title', direction: 'asc', page: 1, size: 25 })] },
});

export const notesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notes',
  validateSearch: (search: Record<string, unknown>): {project?:string;q?:string;note?:string;sort?:string;archive?:string;tag?:string} => ({
    archive: ['archived', 'all'].includes(String(search.archive)) ? String(search.archive) : undefined,
    tag: typeof search.tag === 'string' ? search.tag.slice(0,40) : undefined,
    sort: ['updated-desc', 'created-asc'].includes(String(search.sort)) ? String(search.sort) : undefined,
    note: typeof search.note === 'string' ? search.note : undefined,
    project: typeof search.project === 'string' ? search.project : undefined,
    q: typeof search.q === 'string' ? search.q.slice(0,200) : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.project) {
      const { project, ...rest } = search;
      throw redirect({ to: '/notes', search: { ...rest, projectId: search.projectId ?? project, scope: undefined }, replace: true });
    }
  },
  component: NotesRoute,
});

export const noteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notes/$noteId',
  beforeLoad: ({params, search}) => {throw redirect({to:'/notes',search:{...search,note:params.noteId},replace:true});},
});

export const docsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects/$projectId/artifacts',
  validateSearch: (s: Record<string, unknown>): { folder?: string } => ({ folder: typeof s.folder === 'string' ? s.folder : undefined }),
  beforeLoad: ({ params, search }) => { throw redirect({ to: '/artifacts', search: { projectId: params.projectId, folder: search.folder }, replace: true }); },
});
export const docRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects/$projectId/artifacts/$docId',
  validateSearch: (s: Record<string, unknown>): { version?: number } => ({ version: parseVersionSearch(s.version) }),
  beforeLoad: ({ params, search }) => { throw redirect({ to: '/artifacts/$docId', params: { docId: params.docId }, search: { projectId: params.projectId, version: search.version }, replace: true }); },
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


export const projectsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects', validateSearch: (search: Partial<ListingSearch> & SearchSchemaInput) => parseListingSearch(search, ['manual', 'name'], 'manual'), component: WorkspacesPage });

export const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects/$projectId/settings', component: WorkspaceSettingsPage });

export const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me', component: AccountPage });

const editorPlaygroundRoute = createRoute({ getParentRoute: () => rootRoute, path: '/playground/editor', component: EditorPlaygroundRoute });

export const routeTree = rootRoute.addChildren([
  ...(import.meta.env.DEV ? [editorPlaygroundRoute] : []),
  loginRoute, invitationRoute,
  legacyDocsRoute,
  legacyDocRoute,
  legacyDiscoveriesRoute,
  legacyDiscoveryRoute,
  accountRoute,
  personalTasksRoute,
  projectTasksRoute,
  personalArtifactsRoute,
  artifactCreateRoute,
  personalArtifactRoute,
  projectsRoute,
  settingsRoute,
  membersRoute,
  indexRoute,
  tasksRoute,
  notesRoute,
  noteRoute,
  docsRoute,
  docRoute,
]);

export const router = createRouter({ routeTree, context: { queryClient }, defaultPreloadStaleTime: 0, defaultErrorComponent: RouteError, defaultPendingComponent: RoutePending, defaultPendingMs: 200, defaultPendingMinMs: 0 });

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
