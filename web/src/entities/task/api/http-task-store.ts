import { HttpClient } from '@angular/common/http';
import { afterNextRender, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type TaskView } from '@/shared/api';
import type { Task } from '../model/task';
import type { TaskDraft, TaskSeed, TaskStore } from './task-store';

/**
 * 변경에 httpResource 를 쓰지 않습니다. 읽기 전용이고 요청이 바뀌면 진행 중인 작업을
 * 중단해 저장이 도중에 취소됩니다. 09-state.md 4절.
 *
 * 변경 뒤 목록을 다시 부르지 않고 응답을 상태에 넣습니다. 07-api-design.md 2절.
 */
@Injectable()
export class HttpTaskStore implements TaskStore {
  private readonly http = inject(HttpClient);
  private readonly state = signal<readonly Task[]>([]);

  readonly tasks = this.state.asReadonly();

  constructor() {
    // 정적 생성은 백엔드 없이 도는 빌드 단계라, 서버에서 부르면 프리렌더가 응답을 기다리다 끊깁니다.
    afterNextRender(() => void this.refresh());
  }

  async add(title: string, seed: TaskSeed = {}): Promise<void> {
    const created = await firstValueFrom(
      this.http.post<TaskView>(ENDPOINTS.tasks, { title, dueDate: seed.dueDate ?? null }),
    );
    this.state.update((tasks) => [...tasks, created]);

    // 셋은 각자 하위 자원이라 생성 요청에 함께 담으면 같은 값을 두 경로로 바꾸게 됩니다.
    if (seed.important) await this.setImportant(created.id, true);
    if (seed.inMyDay) await this.setMyDay(created.id, true);
    if (seed.remindAt) {
      await this.update(created.id, {
        title: created.title,
        note: created.note,
        dueDate: created.dueDate,
        remindAt: seed.remindAt,
      });
    }
  }

  async setCompleted(id: string, completed: boolean): Promise<void> {
    this.replace(
      await firstValueFrom(this.http.patch<TaskView>(ENDPOINTS.taskCompletion(id), { completed })),
    );
  }

  async setImportant(id: string, important: boolean): Promise<void> {
    this.replace(
      await firstValueFrom(this.http.patch<TaskView>(ENDPOINTS.taskImportance(id), { important })),
    );
  }

  async setMyDay(id: string, inMyDay: boolean): Promise<void> {
    this.replace(
      await firstValueFrom(this.http.patch<TaskView>(ENDPOINTS.taskMyDay(id), { inMyDay })),
    );
  }

  async update(id: string, patch: TaskDraft): Promise<void> {
    this.replace(await firstValueFrom(this.http.patch<TaskView>(ENDPOINTS.task(id), patch)));
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.task(id)));
    this.state.update((tasks) => tasks.filter((task) => task.id !== id));
  }

  private async refresh(): Promise<void> {
    this.state.set(await firstValueFrom(this.http.get<TaskView[]>(ENDPOINTS.tasks)));
  }

  private replace(changed: TaskView): void {
    this.state.update((tasks) => tasks.map((task) => (task.id === changed.id ? changed : task)));
  }
}
