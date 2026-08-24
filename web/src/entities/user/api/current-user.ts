import { isPlatformServer } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ENDPOINTS, type MeView } from '@/shared/api';

/**
 * 로그인한 사용자 자신입니다. 셸의 프로필 자리와 계정 화면이 같은 사본을 봅니다.
 *
 * 셸 라우트의 providers 에 등록합니다. 로그인 화면은 셸 밖이라 이 조회가 나가지 않고,
 * 로그인해 셸로 들어올 때마다 새 인스턴스가 사본을 새로 받습니다. 프로필을 고치는
 * 조작 뒤에는 부른 쪽이 reload() 합니다.
 */
@Injectable()
export class CurrentUser {
  /** 정적 생성은 백엔드 없이 도는 빌드 단계라 서버에서는 요청을 보내지 않습니다. */
  private readonly server = isPlatformServer(inject(PLATFORM_ID));

  private readonly resource = httpResource<MeView>(() => (this.server ? undefined : ENDPOINTS.me));

  /** 아직 없거나 실패했으면 undefined 입니다. 실패는 로그인 전이라는 뜻이 대부분입니다. */
  readonly me = computed<MeView | undefined>(() =>
    this.resource.hasValue() ? this.resource.value() : undefined,
  );

  readonly status = this.resource.status;

  reload(): void {
    this.resource.reload();
  }
}
