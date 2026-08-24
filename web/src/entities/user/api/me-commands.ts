import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type IssuedApiToken, type PresignedUpload } from '@/shared/api';

@Injectable()
export class MeCommands {
  private readonly http = inject(HttpClient);

  async changeNickname(nickname: string): Promise<void> {
    await firstValueFrom(this.http.patch<void>(ENDPOINTS.me, { nickname }));
  }

  async issueApiToken(): Promise<IssuedApiToken> {
    return firstValueFrom(this.http.post<IssuedApiToken>(ENDPOINTS.apiToken, {}));
  }

  async deleteApiToken(): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.apiToken));
  }

  async presignProfileImage(
    fileName: string,
    contentType: string,
    size: number,
  ): Promise<PresignedUpload> {
    return firstValueFrom(
      this.http.post<PresignedUpload>(ENDPOINTS.profileImagePresign, {
        fileName,
        contentType,
        size,
      }),
    );
  }

  async confirmProfileImage(objectKey: string): Promise<void> {
    await firstValueFrom(this.http.put<void>(ENDPOINTS.profileImage, { objectKey }));
  }

  async clearProfileImage(): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.profileImage));
  }
}
