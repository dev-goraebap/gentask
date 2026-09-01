import type { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/shared/config';
import { routes } from './app.routes';
import { BOTTOM_NAV } from './layout/nav-items';

describe('app.routes 의 첫 자리', () => {
  /*
   * 홈은 리다이렉트가 아니라 화면이다. 오늘 할 일과 프로젝트가 함께 서는 자리이며, 리다이렉트로
   * 되돌리면 프로젝트를 고를 자리가 다시 없어진다.
   */
  it('홈이 실제 화면이다', () => {
    const home = shellChildren().find((child) => child.path === '');

    expect(home?.loadComponent).toBeDefined();
    expect(home?.redirectTo).toBeUndefined();
    expect(ROUTES.home()).toBe('/');
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
