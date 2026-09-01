import type { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/shared/config';
import { routes } from './app.routes';

/*
 * 라우트의 순서를 세는 검사다. 보통은 동작을 재지 순서를 세지 않지만, 이 자리는 순서가 틀렸을 때
 * 터지지 않고 **다른 화면을 그린다**. `toTaskView` 가 모르는 값을 `all` 로 떨어뜨리므로
 * `/todo/memos` 가 메모 대신 전체 할 일 목록이 되고, 빌드도 린트도 그것을 잡지 못한다.
 */
describe('app.routes 의 투두 자리', () => {
  it('메모가 목록 자리보다 먼저 선다', () => {
    const children = todoChildren();

    const memos = children.findIndex((child) => child.path === 'memos');
    const view = children.findIndex((child) => child.path === ':view');

    expect(memos).toBeGreaterThanOrEqual(0);
    expect(view).toBeGreaterThanOrEqual(0);
    expect(memos).toBeLessThan(view);
  });

  it('주소 규격이 가리키는 자리가 라우트에 있다', () => {
    const children = todoChildren();
    const paths = children.map((child) => child.path);

    expect(ROUTES.todo()).toBe('/todo');
    expect(ROUTES.memos()).toBe('/todo/memos');
    expect(ROUTES.taskList('my-day')).toBe('/todo/my-day');

    expect(paths).toContain('memos');
    expect(paths).toContain(':view');
    // 그릇 자체는 메뉴다. 목록을 겸하지 않으므로 빈 경로가 따로 있어야 한다.
    expect(paths).toContain('');
  });
});

function todoChildren(): readonly Route[] {
  const shell = routes.find((route) => route.path === '');
  const todo = shell?.children?.find((child) => child.path === 'todo');

  expect(todo).toBeDefined();

  return todo?.children ?? [];
}
