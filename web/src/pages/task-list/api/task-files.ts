import { isPlatformServer } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { inject, PLATFORM_ID, type Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type PresignedUpload, type TaskFileView } from '@/shared/api';
import type { UploadedFile } from '@/shared/lib';

export interface TaskFiles {
  value: Signal<TaskFileView[] | undefined>;
  hasValue(): boolean;
  presign(
    taskId: string,
    fileName: string,
    contentType: string,
    size: number,
  ): Promise<PresignedUpload>;
  attachAll(taskId: string, uploads: readonly UploadedFile[]): Promise<void>;
  detach(taskId: string, fileId: string): Promise<void>;
}

export function injectTaskFiles(taskId: Signal<string | undefined>): TaskFiles {
  const httpClient = inject(HttpClient);
  const isServer = isPlatformServer(inject(PLATFORM_ID));

  const resource = httpResource<TaskFileView[]>(() => {
    if (isServer) return undefined;
    const id = taskId();
    return id ? ENDPOINTS.taskFiles(id) : undefined;
  });

  return {
    value: resource.value,
    hasValue: () => resource.hasValue(),

    presign(taskId, fileName, contentType, size) {
      return firstValueFrom(
        httpClient.post<PresignedUpload>(ENDPOINTS.taskFilePresign(taskId), {
          fileName,
          contentType,
          size,
        }),
      );
    },

    async attachAll(taskId, uploads) {
      const failed: string[] = [];
      try {
        for (const upload of uploads) {
          try {
            await firstValueFrom(
              httpClient.post<TaskFileView>(ENDPOINTS.taskFiles(taskId), {
                objectKey: upload.objectKey,
                fileName: upload.file.name,
                contentType: upload.file.type,
              }),
            );
          } catch {
            failed.push(upload.file.name);
          }
        }
      } finally {
        resource.reload();
      }

      if (failed.length > 0) {
        throw new Error(`${failed.join(', ')} 을(를) 붙이지 못했습니다.`);
      }
    },

    async detach(taskId, fileId) {
      await firstValueFrom(httpClient.delete<void>(ENDPOINTS.taskFile(taskId, fileId)));
      resource.reload();
    },
  };
}
