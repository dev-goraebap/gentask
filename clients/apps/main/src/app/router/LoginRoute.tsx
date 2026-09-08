import { LoginPage } from '@/pages/login';
import { useNavigate, useSearch } from '@tanstack/react-router';
export function LoginRoute() {
  const navigate = useNavigate();
  const { invite } = useSearch({ from: '/login' });
  return <LoginPage onLoggedIn={() => invite ? navigate({ to: '/invitations/$token', params: { token: invite }, replace: true }) : navigate({ to: '/notes', replace: true })} />;
}
