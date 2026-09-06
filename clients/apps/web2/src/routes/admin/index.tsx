import { createFileRoute, redirect } from '@tanstack/react-router';
import { ROUTES } from '@/shared/config/routes';

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    throw redirect({ to: ROUTES.adminUsers() });
  },
});
