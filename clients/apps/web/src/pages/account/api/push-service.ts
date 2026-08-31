import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type PushConfigView, type PushSubscriptionStateView } from '@/shared/api';
import {
  currentSubscription,
  resolveInstallState,
  subscribe,
  unsubscribe,
  type InstallState,
} from '@/shared/lib';

/** 이 기기의 알림 상태. 화면이 그리는 근거다. */
export type PushState =
  /** 아직 판정하지 않았다. */
  | 'unknown'
  /** 켤 수 있으나 꺼져 있다. */
  | 'off'
  /** 이 기기가 받을 자리로 등록되어 있다. */
  | 'on'
  /** iOS 이고 브라우저 탭이다. 홈 화면에 추가해야 켤 수 있다. */
  | 'needs-install'
  /** 이 브라우저는 웹 푸시를 지원하지 않는다. */
  | 'unsupported'
  /** 권한이 거절되어 있다. 브라우저 설정에서 바꿔야 한다. */
  | 'denied';

@Injectable()
export class PushService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly _state = signal<PushState>('unknown');
  readonly state = this._state.asReadonly();

  // --- 동작 --------------------------------------------------------------------------------------

  /** 화면이 뜰 때 이 기기의 상태를 판정한다. 권한을 묻지 않는다. */
  async refresh(): Promise<void> {
    if (this.isServer) return;

    const install: InstallState = resolveInstallState();
    if (install !== 'ready') {
      this._state.set(install === 'needs-install' ? 'needs-install' : 'unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      this._state.set('denied');
      return;
    }
    const keys = await currentSubscription();
    if (!keys) {
      this._state.set('off');
      return;
    }
    // 브라우저의 구독은 기기에 남고 계정과 무관하다. 서버가 이 자리를 아는지 함께 묻지 않으면,
    // 다른 계정으로 들어왔거나 서버가 죽은 자리를 걷은 뒤에도 받는 상태로 그려진다.
    this._state.set((await this.isRegistered(keys.endpoint)) ? 'on' : 'off');
  }

  /**
   * 서버가 이 자리를 받을 대상으로 알고 있는지 묻는다.
   *
   * <p>묻지 못하면 꺼진 것으로 둔다. 반대로 두면 받지 못하는 상태를 받는다고 그리게 되고, 사용자는
   * 알림이 오지 않는 이유를 알 자리가 없다. 꺼진 것으로 두면 켜기를 눌러 다시 등록된다.
   */
  private async isRegistered(endpoint: string): Promise<boolean> {
    try {
      const view = await firstValueFrom(
        this.httpClient.get<PushSubscriptionStateView>(ENDPOINTS.pushSubscription, {
          params: { endpoint },
        }),
      );
      return view.registered;
    } catch {
      return false;
    }
  }

  /** 알림을 켠다. 권한 요청이 사용자의 조작에서 곧바로 이어져야 하므로 클릭 처리에서 부른다. */
  async enable(): Promise<void> {
    const config = await firstValueFrom(
      this.httpClient.get<PushConfigView>(ENDPOINTS.pushConfig),
    );
    const result = await subscribe(config.publicKey);
    if (result.status === 'denied') {
      this._state.set('denied');
      return;
    }
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.pushSubscription, result.keys));
    this._state.set('on');
  }

  /** 알림을 끈다. 브라우저 권한은 그대로 두고 받을 자리만 거둔다. */
  async disable(): Promise<void> {
    const endpoint = await unsubscribe();
    if (endpoint) {
      await firstValueFrom(
        this.httpClient.delete<void>(ENDPOINTS.pushSubscription, { body: { endpoint } }),
      );
    }
    this._state.set('off');
  }
}
