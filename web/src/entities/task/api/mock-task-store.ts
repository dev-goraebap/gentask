import { Injectable, signal } from '@angular/core';
import type { Task } from '../model/task';
import { toDateKey } from '../model/task';
import type { TaskDraft, TaskSeed, TaskStore } from './task-store';

/**
 * 테스트와 오프라인 개발이 쓰는 구현입니다. 두 구현이 같은 인터페이스를 지키는지가
 * 계약 유지의 확인 수단입니다. 14-api-contract.md 4절.
 */
@Injectable()
export class MockTaskStore implements TaskStore {
  private readonly state = signal<readonly Task[]>(SEED);

  readonly tasks = this.state.asReadonly();

  async add(title: string, seed: TaskSeed = {}): Promise<void> {
    const now = new Date();
    const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      createdAt: now.toISOString(),
      completedAt: null,
      note: '',
      dueDate: seed.dueDate ?? null,
      remindAt: seed.remindAt ?? null,
      important: seed.important ?? false,
      myDayOn: seed.inMyDay ? toDateKey(now) : null,
    };
    this.state.update((tasks) => [...tasks, task]);
  }

  async setImportant(id: string, important: boolean): Promise<void> {
    this.state.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, important } : task)),
    );
  }

  async setMyDay(id: string, inMyDay: boolean): Promise<void> {
    const today = inMyDay ? toDateKey(new Date()) : null;
    this.state.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, myDayOn: today } : task)),
    );
  }

  async update(id: string, patch: TaskDraft): Promise<void> {
    this.state.update((tasks) =>
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              title: patch.title.trim(),
              note: patch.note,
              dueDate: patch.dueDate,
              remindAt: patch.remindAt,
            }
          : task,
      ),
    );
  }

  async remove(id: string): Promise<void> {
    this.state.update((tasks) => tasks.filter((task) => task.id !== id));
  }

  /**
   * 이미 완료된 작업을 다시 완료해도 완료한 시각을 덮지 않습니다. 그 시각이 완료된 작업 목록의
   * 순서이며, 덮으면 옛날에 완료한 작업이 방금 완료한 것처럼 올라옵니다.
   */
  async setCompleted(id: string, completed: boolean): Promise<void> {
    const now = new Date().toISOString();
    this.state.update((tasks) =>
      tasks.map((task) => {
        if (task.id !== id) return task;
        if (completed) return task.completedAt ? task : { ...task, completedAt: now };
        return task.completedAt ? { ...task, completedAt: null } : task;
      }),
    );
  }
}

/**
 * 빈 화면만 보고 판단하지 않도록 몇 개를 미리 둡니다. 정지 조건의 시나리오를 시연할 때
 * 목록이 비어 있으면 정렬과 완료 섹션을 확인할 수 없습니다.
 */
const SEED: readonly Task[] = [
  {
    id: 'seed-1',
    title: '장 보기',
    createdAt: '2026-08-17T09:00:00.000Z',
    completedAt: null,
    note: '',
    dueDate: null,
    remindAt: null,
    important: false,
    myDayOn: null,
  },
  {
    id: 'seed-2',
    title: '전기요금 납부',
    createdAt: '2026-08-17T10:30:00.000Z',
    completedAt: null,
    note: '',
    dueDate: '2026-08-25',
    remindAt: '2026-08-25T09:00',
    important: true,
    myDayOn: null,
  },
  {
    id: 'seed-3',
    title: '자전거 공기압 확인',
    createdAt: '2026-08-16T18:00:00.000Z',
    completedAt: '2026-08-17T08:10:00.000Z',
    note: '앞바퀴만 확인했다. 뒷바퀴는 다음에.',
    dueDate: null,
    remindAt: null,
    important: false,
    myDayOn: null,
  },
  {
    id: 'seed-4',
    title: '건강검진 예약',
    createdAt: '2026-08-15T11:00:00.000Z',
    completedAt: null,
    note: '',
    dueDate: '2026-08-14',
    remindAt: null,
    important: false,
    myDayOn: null,
  },
];
