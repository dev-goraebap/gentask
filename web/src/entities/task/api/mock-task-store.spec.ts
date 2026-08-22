import { MockTaskStore } from './mock-task-store';

/*
 * 완료의 경계 조건은 화면에서 만들 수 없습니다. 완료된 작업의 체크박스는 되돌리기이고,
 * 없는 일에는 체크박스가 없습니다. 그래서 그 경로의 끝인 저장소에서 확인합니다.
 */
describe('MockTaskStore.setCompleted', () => {
  function store(): MockTaskStore {
    return new MockTaskStore();
  }

  function completedIds(s: MockTaskStore): string[] {
    return s
      .tasks()
      .filter((t) => t.completedAt !== null)
      .map((t) => t.id);
  }

  it('완료하면 완료한 시각이 붙는다', async () => {
    const s = store();
    const target = s.tasks().find((t) => t.completedAt === null)!;

    await s.setCompleted(target.id, true);

    expect(s.tasks().find((t) => t.id === target.id)?.completedAt).not.toBeNull();
  });

  it('TK-004 S2: 이미 완료된 작업은 그대로 완료된 작업이다', async () => {
    const s = store();
    const target = s.tasks().find((t) => t.completedAt === null)!;
    await s.setCompleted(target.id, true);
    const first = s.tasks().find((t) => t.id === target.id)?.completedAt;

    await new Promise((r) => setTimeout(r, 5));
    await s.setCompleted(target.id, true);

    // 완료한 시각이 완료된 작업 목록의 순서이므로 덮이면 안 됩니다.
    expect(s.tasks().find((t) => t.id === target.id)?.completedAt).toBe(first);
  });

  it('TK-004 S2: 없는 작업은 완료할 수 없다', async () => {
    const s = store();
    const before = s.tasks();

    await s.setCompleted('없는-식별자', true);

    expect(s.tasks()).toEqual(before);
    expect(completedIds(s)).toEqual(completedIds(store()));
  });
});
