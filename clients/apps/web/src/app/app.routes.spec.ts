import type { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/shared/config';
import { routes } from './app.routes';
import { SHELL_AREA } from './layout/nav-items';

describe('app.routes 의 투두 자리', () => {
  /*
   * 이 자리가 무너지는 방식은 터지는 것이 아니라 **한 주소가 두 가지 뜻을 갖는 것**이다. 그릇이
   * 목록을 겸하면 좁은 화면의 메뉴가 설 자리가 없어지고, 그릇 이름과 그 안의 항목 이름이 같아지면
   * `할 일` 처럼 한 말이 두 층을 가리킨다. 둘 다 빌드와 린트를 지난다.
   */
  it('그릇은 메뉴이고 목록을 겸하지 않는다', () => {
    const paths = todoChildren().map((child) => child.path);

    expect(paths).toContain('');
    expect(paths).toContain(':view');
  });

  it('그릇 이름과 그 안의 항목 이름이 다르다', () => {
    expect(ROUTES.todo()).toBe('/todo');
    expect(ROUTES.taskList('all')).toBe('/todo/all');
    expect(ROUTES.taskList('my-day')).toBe('/todo/my-day');
  });

  /*
   * 메모와 팻과 뽀모도로는 모드에 매이지 않는다. 그릇 안으로 들어가면 다른 모드의 더보기에서
   * 가리키는 주소가 그 모드를 건너가는 주소가 된다.
   */
  it('모드에 매이지 않는 자리는 그릇 밖에 선다', () => {
    const paths = todoChildren().map((child) => child.path);

    expect(paths).not.toContain('memos');
    expect(ROUTES.memos()).toBe('/memos');
    expect(ROUTES.pets()).toBe('/pets');
    expect(ROUTES.pomodoro()).toBe('/pomodoro');
    expect(ROUTES.account()).toBe('/me');
  });
});

describe('app.routes 의 프로젝트 자리', () => {
  /*
   * `/projects` 와 `/projects/<id>` 는 서로 다른 껍데기를 쓴다 — 앞은 계정 메뉴, 뒤는 트래커
   * 메뉴다. 세그먼트 수가 적은 쪽이 먼저 서면 `/projects/<id>` 를 그것이 먼저 잡고 자식에서
   * 실패해 라우터의 되짚기에 기대게 된다. 되짚기가 도는 동안은 터지지 않으므로, 검사가 없으면
   * 순서를 되돌려도 아무도 모른다.
   */
  it('프로젝트 하나의 자리가 프로젝트들보다 먼저 선다', () => {
    const one = routes.findIndex((route) => route.path === 'projects/:projectId');
    const many = routes.findIndex((route) => route.path === 'projects');

    expect(one).toBeGreaterThanOrEqual(0);
    expect(many).toBeGreaterThanOrEqual(0);
    expect(one).toBeLessThan(many);
  });

  it('프로젝트들은 계정 자리에 서고 프로젝트 하나는 트래커 자리에 선다', () => {
    expect(areaOf('projects')).toBe('account');
    expect(areaOf('projects/:projectId')).toBe('tracker');
    expect(areaOf('me')).toBe('account');
  });
});

function areaOf(path: string): unknown {
  const route = routes.find((candidate) => candidate.path === path);

  for (const provider of route?.providers ?? []) {
    if (typeof provider !== 'object' || provider === null) continue;
    if (!('provide' in provider) || provider.provide !== SHELL_AREA) continue;

    return 'useValue' in provider ? provider.useValue : undefined;
  }

  return undefined;
}

function todoChildren(): readonly Route[] {
  const shell = routes.find((route) => route.path === '');
  const todo = shell?.children?.find((child) => child.path === 'todo');

  expect(todo).toBeDefined();

  return todo?.children ?? [];
}
