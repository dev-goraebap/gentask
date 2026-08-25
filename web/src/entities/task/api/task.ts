import { isPlatformServer } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from '@/shared/api';
import type { Task } from '../model/task';

export type TaskSeed = {
  readonly important?: boolean;
  readonly inMyDay?: boolean;
  readonly dueDate?: string | null;

  readonly remindAt?: string | null;
};

export type TaskDraft = {
  title: string;
  note: string;

  dueDate: string | null;

  remindAt: string | null;
};

@Injectable()
export class TaskService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  // --- 파생 --------------------------------------------------------------------------------------
  private readonly resource = httpResource<readonly Task[]>(() =>
    this.isServer ? undefined : ENDPOINTS.tasks,
  );

  readonly list = computed<readonly Task[]>(() =>
    this.resource.hasValue() ? this.resource.value() : [],
  );

  readonly status = this.resource.status;

  // --- 동작 --------------------------------------------------------------------------------------
  async add(title: string, seed: TaskSeed = {}): Promise<void> {
    const taskId = await this.create(title, seed.dueDate ?? null);

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
    this.resource.reload();
  }

  async setCompleted(id: string, completed: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskCompletion(id), { completed });
    this.resource.reload();
  }

  async setImportant(id: string, important: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskImportance(id), { important });
    this.resource.reload();
  }

  async setMyDay(id: string, inMyDay: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskMyDay(id), { inMyDay });
    this.resource.reload();
  }

  async update(id: string, patch: TaskDraft): Promise<void> {
    await this.patch(ENDPOINTS.task(id), patch);
    this.resource.reload();
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.httpClient.delete<void>(ENDPOINTS.task(id)));
    this.resource.reload();
  }

  reload(): void {
    this.resource.reload();
  }

  private async create(title: string, dueDate: string | null): Promise<string> {
    const response = await firstValueFrom(
      this.httpClient.post(ENDPOINTS.tasks, { title, dueDate }, { observe: 'response' }),
    );
    const location = response.headers.get('Location');
    if (!location) throw new Error('Location 헤더가 없어 만든 작업을 가리킬 수 없습니다.');
    return location.slice(location.lastIndexOf('/') + 1);
  }

  private async patch(url: string, body: object): Promise<void> {
    await firstValueFrom(this.httpClient.patch<void>(url, body));
  }
}
