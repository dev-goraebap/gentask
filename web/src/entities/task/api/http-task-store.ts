import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type TaskView } from '@/shared/api';
import type { Task } from '../model/task';
import type { TaskDraft, TaskSeed, TaskStore } from './task-store';

/**
 * 변경에 httpResource 를 쓰지 않습니다. 읽기 전용이고 요청이 바뀌면 진행 중인 작업을
 * 중단해 저장이 도중에 취소됩니다. 09-state.md 4절.
 *
 * 변경은 성공 여부만 받고 화면의 값은 목록을 다시 받아 채웁니다. 07-api-design.md 2절.
 */
@Injectable()
export class HttpTaskStore implements TaskStore {
  private readonly http = inject(HttpClient);
  private readonly state = signal<readonly Task[]>([]);

  readonly tasks = this.state.asReadonly();

  async load(): Promise<void> {
    this.state.set(await firstValueFrom(this.http.get<TaskView[]>(ENDPOINTS.tasks)));
  }

  async add(title: string, seed: TaskSeed = {}): Promise<void> {
    const taskId = await this.create(title, seed.dueDate ?? null);

    // 셋은 각자 하위 자원이라 생성 요청에 함께 담으면 같은 값을 두 경로로 바꾸게 됩니다.
    if (seed.important) await this.patch(ENDPOINTS.taskImportance(taskId), { important: true });
    if (seed.inMyDay) await this.patch(ENDPOINTS.taskMyDay(taskId), { inMyDay: true });
    if (seed.remindAt) {
      await this.patch(ENDPOINTS.task(taskId), {
        title,
        note: '',
        dueDate: seed.dueDate ?? null,
        remindAt: seed.remindAt,
      });
    }

    await this.load();
  }

  async setCompleted(id: string, completed: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskCompletion(id), { completed });
    await this.load();
  }

  async setImportant(id: string, important: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskImportance(id), { important });
    await this.load();
  }

  async setMyDay(id: string, inMyDay: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskMyDay(id), { inMyDay });
    await this.load();
  }

  async update(id: string, patch: TaskDraft): Promise<void> {
    await this.patch(ENDPOINTS.task(id), patch);
    await this.load();
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.task(id)));
    await this.load();
  }

  /**
   * 만든 것의 식별자를 Location 에서 꺼냅니다. 응답 본문에는 없습니다. 07-api-design.md 2절.
   *
   * 다른 출처의 서버를 부르게 되면 `Access-Control-Expose-Headers` 없이는 이 헤더가
   * 보이지 않습니다. 개발 프록시를 거치는 동안은 같은 출처라 드러나지 않습니다.
   */
  private async create(title: string, dueDate: string | null): Promise<string> {
    const response = await firstValueFrom(
      this.http.post(ENDPOINTS.tasks, { title, dueDate }, { observe: 'response' }),
    );
    const location = response.headers.get('Location');
    if (!location) throw new Error('Location 헤더가 없어 만든 작업을 가리킬 수 없습니다.');
    return location.slice(location.lastIndexOf('/') + 1);
  }

  private async patch(url: string, body: object): Promise<void> {
    await firstValueFrom(this.http.patch<void>(url, body));
  }
}
