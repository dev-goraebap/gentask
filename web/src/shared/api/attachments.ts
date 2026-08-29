import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from './endpoints';
import type { PresignedUpload } from './index';

/** 서버가 받는 자리 이름. 크기와 형식의 정책이 이 값에 매인다. */
export type AttachmentSlot = 'TASK_FILES' | 'USER_PROFILE_IMAGE';

/**
 * 올릴 자리를 받는다. 어디에 붙일지는 여기서 정하지 않으며, 받은 objectKey 를 도메인 경로에 넘겨 붙인다.
 */
export function injectAttachmentPresign(): (
  slot: AttachmentSlot,
  fileName: string,
  contentType: string,
  size: number,
) => Promise<PresignedUpload> {
  const httpClient = inject(HttpClient);

  return (slot, fileName, contentType, size) =>
    firstValueFrom(
      httpClient.post<PresignedUpload>(ENDPOINTS.attachmentPresign, {
        slot,
        fileName,
        contentType,
        size,
      }),
    );
}
