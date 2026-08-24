import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type PresignedUpload, type TaskFileView } from '@/shared/api';

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
export class TaskCommands {
  private readonly http = inject(HttpClient);

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
  }

  async setCompleted(id: string, completed: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskCompletion(id), { completed });
  }

  async setImportant(id: string, important: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskImportance(id), { important });
  }

  async setMyDay(id: string, inMyDay: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskMyDay(id), { inMyDay });
  }

  async update(id: string, patch: TaskDraft): Promise<void> {
    await this.patch(ENDPOINTS.task(id), patch);
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.task(id)));
  }

  async presignFile(
    taskId: string,
    fileName: string,
    contentType: string,
    size: number,
  ): Promise<PresignedUpload> {
    return firstValueFrom(
      this.http.post<PresignedUpload>(ENDPOINTS.taskFilePresign(taskId), {
        fileName,
        contentType,
        size,
      }),
    );
  }

  async attachFile(
    taskId: string,
    objectKey: string,
    fileName: string,
    contentType: string,
  ): Promise<TaskFileView> {
    return firstValueFrom(
      this.http.post<TaskFileView>(ENDPOINTS.taskFiles(taskId), {
        objectKey,
        fileName,
        contentType,
      }),
    );
  }

  async detachFile(taskId: string, fileId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.taskFile(taskId, fileId)));
  }

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
