import { WorkspaceProvider } from '@/entities/workspace';
import { AppShellLayout } from '@/widgets/app-shell';
import { AppAsideProvider, AppAsideLayout } from '@/shared/ui/app-aside';
import { Outlet, useLocation } from '@tanstack/react-router';

export function RootLayout() {
  const login = useLocation({ select: location => location.pathname === '/login' || location.pathname.startsWith('/invitations/') || (import.meta.env.DEV && location.pathname === '/playground/editor') });
  return login ? <Outlet /> : <WorkspaceProvider><AppAsideProvider><AppAsideLayout><AppShellLayout /></AppAsideLayout></AppAsideProvider></WorkspaceProvider>;
}
