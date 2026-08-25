import { isPlatformServer } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type IssuedApiToken, type MeView, type PresignedUpload } from '@/shared/api';

@Injectable()
export class UserService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  // --- 파생 --------------------------------------------------------------------------------------
  private readonly resource = httpResource<MeView>(() =>
    this.isServer ? undefined : ENDPOINTS.me,
  );

  readonly me = computed<MeView | undefined>(() =>
    this.resource.hasValue() ? this.resource.value() : undefined,
  );

  readonly status = this.resource.status;

  // --- 동작 --------------------------------------------------------------------------------------
  async changeNickname(nickname: string): Promise<void> {
    await firstValueFrom(this.httpClient.patch<void>(ENDPOINTS.me, { nickname }));
    this.resource.reload();
  }

  async issueApiToken(): Promise<IssuedApiToken> {
    const issued = await firstValueFrom(
      this.httpClient.post<IssuedApiToken>(ENDPOINTS.apiToken, {}),
    );
    this.resource.reload();
    return issued;
  }

  async deleteApiToken(): Promise<void> {
    await firstValueFrom(this.httpClient.delete<void>(ENDPOINTS.apiToken));
    this.resource.reload();
  }

  async presignProfileImage(
    fileName: string,
    contentType: string,
    size: number,
  ): Promise<PresignedUpload> {
    return firstValueFrom(
      this.httpClient.post<PresignedUpload>(ENDPOINTS.profileImagePresign, {
        fileName,
        contentType,
        size,
      }),
    );
  }

  async confirmProfileImage(objectKey: string): Promise<void> {
    await firstValueFrom(this.httpClient.put<void>(ENDPOINTS.profileImage, { objectKey }));
    this.resource.reload();
  }

  async clearProfileImage(): Promise<void> {
    await firstValueFrom(this.httpClient.delete<void>(ENDPOINTS.profileImage));
    this.resource.reload();
  }

  reload(): void {
    this.resource.reload();
  }
}
