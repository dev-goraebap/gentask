import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type IssuedApiToken, type PresignedUpload } from '@/shared/api';

/**
 * 프로필을 바꾸는 명령들 (TK-006). 상태를 갖지 않으며, 성공 뒤에는 부른 쪽이
 * CurrentUser.reload() 로 사본을 다시 받습니다. 셸 라우트의 providers 에 등록합니다.
 */
@Injectable()
export class MeCommands {
  private readonly http = inject(HttpClient);

  async changeNickname(nickname: string): Promise<void> {
    await firstValueFrom(this.http.patch<void>(ENDPOINTS.me, { nickname }));
  }

  /** 토큰 원문이 실리는 유일한 응답입니다. 다시 물을 수 없으므로 받은 자리에서 보여 줍니다. */
  async issueApiToken(): Promise<IssuedApiToken> {
    return firstValueFrom(this.http.post<IssuedApiToken>(ENDPOINTS.apiToken, {}));
  }

  async deleteApiToken(): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.apiToken));
  }

  /** 백엔드는 URL 만 줍니다. 바이트는 브라우저가 보관소로 직접 올립니다. */
  async presignProfileImage(fileName: string, contentType: string, size: number): Promise<PresignedUpload> {
    return firstValueFrom(
      this.http.post<PresignedUpload>(ENDPOINTS.profileImagePresign, { fileName, contentType, size }),
    );
  }

  async confirmProfileImage(objectKey: string): Promise<void> {
    await firstValueFrom(this.http.put<void>(ENDPOINTS.profileImage, { objectKey }));
  }

  async clearProfileImage(): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.profileImage));
  }
}
