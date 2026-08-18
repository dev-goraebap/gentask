import { Injectable, signal } from '@angular/core';
import type { Task } from '../model/task';
import type { TaskStore } from './task-store';

/**
 * 프로토타입 구간의 구현입니다. 서버가 없는 동안 이 클래스가 원본을 소유합니다.
 *
 * 화면은 여전히 사본만 읽고 변경은 명령으로 보냅니다. 그 규율을 프로토타입 구간에도
 * 지켜야 백엔드 연결이 프로바이더 교체로 끝납니다.
 *
 * 백엔드 연결 후에도 이 구현을 지우지 않습니다. 테스트와 오프라인 개발에서 계속 쓰이며,
 * 두 구현이 같은 인터페이스를 지키는지가 계약 유지의 확인 수단이 됩니다.
 * 14-api-contract.md 4절.
 */
@Injectable()
export class MockTaskStore implements TaskStore {
  private readonly state = signal<readonly Task[]>(SEED);

  readonly tasks = this.state.asReadonly();

  async add(title: string): Promise<void> {
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      createdAt: now,
      completedAt: null,
    };
    this.state.update((tasks) => [...tasks, task]);
  }

  async setCompleted(id: string, completed: boolean): Promise<void> {
    const now = completed ? new Date().toISOString() : null;
    this.state.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, completedAt: now } : task)),
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
  },
  {
    id: 'seed-2',
    title: '전기요금 납부',
    createdAt: '2026-08-17T10:30:00.000Z',
    completedAt: null,
  },
  {
    id: 'seed-3',
    title: '자전거 공기압 확인',
    createdAt: '2026-08-16T18:00:00.000Z',
    completedAt: '2026-08-17T08:10:00.000Z',
  },
];
