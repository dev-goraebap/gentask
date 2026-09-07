import { LoginPage } from '@/pages/login';
import { useNavigate } from '@tanstack/react-router';

export function LoginRoute() {
  const navigate = useNavigate();
  return <LoginPage onLoggedIn={() => navigate({ to: '/projects', replace: true })} />;
}
