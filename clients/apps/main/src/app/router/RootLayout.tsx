import { WorkspaceProvider } from '@/entities/workspace';
import { AppShellLayout } from '@/widgets/app-shell';
import { Outlet, useLocation } from '@tanstack/react-router';

export function RootLayout() {
  const login = useLocation({ select: location => location.pathname === '/login' });
  return login ? <Outlet /> : <WorkspaceProvider><AppShellLayout /></WorkspaceProvider>;
}
