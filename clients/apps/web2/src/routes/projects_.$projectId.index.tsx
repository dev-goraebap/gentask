import { createFileRoute, redirect } from '@tanstack/react-router';
import { ROUTES } from '@/shared/config/routes';

/** 좁은 화면의 메뉴는 아래에 깔린 띠가 갖는다. 그 자리를 화면으로 한 번 더 두지 않는다. */
export const Route = createFileRoute('/projects_/$projectId/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: ROUTES.issues(params.projectId) });
  },
});
