import type { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/shared/config';
import { routes } from './app.routes';

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

function todoChildren(): readonly Route[] {
  const shell = routes.find((route) => route.path === '');
  const todo = shell?.children?.find((child) => child.path === 'todo');

  expect(todo).toBeDefined();

  return todo?.children ?? [];
}
