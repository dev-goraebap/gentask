import type { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/shared/config';
import { routes } from './app.routes';
import { BOTTOM_NAV } from './layout/nav-items';

describe('app.routes 의 첫 자리', () => {
  /*
   * 처음 여는 사람이 오늘 할 것부터 본다. 자리를 고르는 화면을 첫머리에 두면 아무것도 하지 않은
   * 채로 한 단계를 지나게 된다.
   */
  it('첫 자리가 나의 하루다', () => {
    const first = shellChildren().find((child) => child.path === '');

    expect(first?.redirectTo).toBe('todo/my-day');
    expect(ROUTES.taskList('my-day')).toBe('/todo/my-day');
  });

  /*
   * 프로젝트는 모드가 아니라 계정에 매인다. 어느 프로젝트에도 들어가지 않은 상태에서 닿아야 하므로
   * 트래커 자리가 아니라 투두의 메뉴 안에 선다.
   */
  it('프로젝트들이 트래커 자리 밖에 선다', () => {
    const paths = shellChildren().map((child) => child.path);

    expect(paths).toContain('projects');
    expect(ROUTES.projects()).toBe('/projects');
  });

  /*
   * 모드를 고르는 자리를 화면으로 두지 않는다. 좁은 화면에서는 바닥의 띠가, 넓은 화면에서는
   * 사이드바가 그 일을 하므로, 화면으로 한 번 더 두면 같은 것을 두 곳에서 고르게 된다.
   */
  it('그릇에 닿으면 첫 칸으로 보낸다', () => {
    expect(childOf(shellChildren(), 'todo', '')?.redirectTo).toBe('my-day');
    expect(childOf(routes, 'projects/:projectId', '')?.redirectTo).toBe('issues');
  });

  it('모드에 매이지 않는 자리는 그릇 밖에 선다', () => {
    const paths = shellChildren().map((child) => child.path);

    expect(paths).toContain('memos');
    expect(paths).toContain('pets');
    expect(paths).toContain('pomodoro');
    expect(paths).toContain('me');

    expect(ROUTES.memos()).toBe('/memos');
    expect(ROUTES.account()).toBe('/me');
  });

  /*
   * `/projects/<id>` 를 잡을 자리가 껍데기보다 먼저 서야 한다. 뒤에 서면 껍데기가 그 주소를 먼저
   * 잡고 자식인 `projects` 에서 실패해 라우터의 되짚기에 기대게 된다. 되짚기가 도는 동안은 터지지
   * 않으므로, 검사가 없으면 순서를 되돌려도 아무도 모른다.
   */
  it('프로젝트 하나의 자리가 껍데기보다 먼저 선다', () => {
    const one = routes.findIndex((route) => route.path === 'projects/:projectId');
    const shell = routes.findIndex(
      (route) => route.path === '' && route.children !== undefined,
    );

    expect(one).toBeGreaterThanOrEqual(0);
    expect(shell).toBeGreaterThanOrEqual(0);
    expect(one).toBeLessThan(shell);
  });

  /*
   * 바닥의 띠는 자리마다 담기는 것이 다르므로 라우트가 내려 준다. 내려 주지 않으면 그 자리가
   * 투두의 것을 그대로 쓰게 되는데, 터지지 않으므로 눈으로만 드러난다.
   */
  it('자리마다 바닥의 띠를 내려 준다', () => {
    expect(provides(routes, 'projects/:projectId', BOTTOM_NAV)).toBe(true);
    expect(provides(routes, 'admin', BOTTOM_NAV)).toBe(true);
  });
});

function shellChildren(): readonly Route[] {
  const shell = routes.find((route) => route.path === '' && route.children !== undefined);

  expect(shell).toBeDefined();

  return shell?.children ?? [];
}

function childOf(where: readonly Route[], parent: string, child: string): Route | undefined {
  return where.find((route) => route.path === parent)?.children?.find((c) => c.path === child);
}

function provides(where: readonly Route[], path: string, token: unknown): boolean {
  const route = where.find((candidate) => candidate.path === path);

  for (const provider of route?.providers ?? []) {
    if (typeof provider !== 'object' || provider === null) continue;
    if ('provide' in provider && provider.provide === token) return true;
  }

  return false;
}
