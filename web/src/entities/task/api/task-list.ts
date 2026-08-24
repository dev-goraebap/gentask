import { isPlatformServer } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ENDPOINTS } from '@/shared/api';
import type { Task } from '../model/task';

/**
 * 화면이 읽는 목록입니다. `httpResource` 하나를 들고 있으며 대기와 실패가 `status` 로
 * 옵니다. 09-state.md 3.1절.
 *
 * 변경은 여기 없습니다. 상태를 갖지 않는 명령은 TaskCommands 가 갖고, 변경 뒤에는
 * 명령을 부른 쪽이 `reload()` 로 사본을 다시 받습니다. 09-state.md 4.1절.
 *
 * 화면 범위 서비스이므로 라우트 정의의 providers 에 등록하며 providedIn: 'root' 를
 * 쓰지 않습니다. 라우트를 떠나면 파괴되어 낡은 사본이 남지 않습니다. 02-package-structure.md 7.5절.
 */
@Injectable()
export class TaskList {
  /**
   * 서버에서는 요청을 보내지 않습니다. 정적 생성은 백엔드 없이 도는 빌드 단계라,
   * 여기서 부르면 프리렌더가 응답을 기다리다 끊깁니다. 05-rendering.md 1절.
   */
  private readonly server = isPlatformServer(inject(PLATFORM_ID));

  private readonly resource = httpResource<readonly Task[]>(() =>
    this.server ? undefined : ENDPOINTS.tasks,
  );

  /** 화면이 읽는 사본입니다. 아직 없거나 실패했으면 빈 목록입니다. */
  readonly tasks = computed<readonly Task[]>(() =>
    this.resource.hasValue() ? this.resource.value() : [],
  );

  /** 대기 표현의 판정 근거입니다. `loading` 에만 베일, `reloading` 은 이전 값 유지. 09-state.md 3.3절. */
  readonly status = this.resource.status;

  reload(): void {
    this.resource.reload();
  }
}
