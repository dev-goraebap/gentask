import type { Routes } from '@angular/router';
import { provideTaskListDatePicker } from './providers';

/**
 * 투두 모드의 자리.
 *
 * <p>이 갈래의 라우트를 앱이 아니라 이 자리가 갖는다. 날짜 고르개의 설정은 라우트의 `providers` 에
 * 서야 하는데 — 덮개가 라우트의 환경 인젝터로 서므로 컴포넌트의 `providers` 로는 닿지 않는다 —
 * 앱의 라우트 파일이 그 설정을 직접 들여오면 고르개와 달력 묶음이 통째로 첫 묶음에 실린다. 세어 보니
 * 첫 묶음의 1.02 MB 가운데 185 kB 가 그것이었다.
 *
 * <p>여기로 옮기면 투두를 여는 사람만 그 값을 치른다. 관점을 고르는 자리에 설정을 다는 것은 그
 * 아래에서만 쓰이기 때문이다.
 */
export const taskListRoutes: Routes = [
  // 관점을 고르는 자리는 좁은 화면에서 아래의 띠가, 넓은 화면에서 사이드바가 갖는다.
  { path: '', pathMatch: 'full', redirectTo: 'my-day' },
  {
    path: ':view',
    providers: [...provideTaskListDatePicker()],
    loadComponent: () => import('./ui/task-list-page').then((m) => m.TaskListPage),
  },
];
