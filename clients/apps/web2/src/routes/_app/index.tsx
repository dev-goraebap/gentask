import { createFileRoute, redirect } from '@tanstack/react-router';
import { ROUTES } from '@/shared/config/routes';

/**
 * 첫 자리는 나의 하루다. 처음 여는 사람이 오늘 할 것부터 보는 것이 이 제품의 시작이다.
 */
export const Route = createFileRoute('/_app/')({
  beforeLoad: () => {
    throw redirect({ to: ROUTES.taskList('my-day') });
  },
});
