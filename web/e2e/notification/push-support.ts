import { type Page } from '@playwright/test';

// 알림 화면의 판정은 브라우저의 상태에서 나온다. 헤드리스에는 홈 화면도 푸시 서비스도 없으므로
// 그 상태를 페이지가 뜨기 전에 심는다. 판정 코드는 shared/lib/install 에 있으며,
// 화면이 그것을 생성 시점에 한 번 부르므로 스크립트가 문서보다 먼저 돌아야 한다.

/** iPhone Safari 의 자기 소개. 판정이 사용자 에이전트로 iOS 를 가른다. */
export const IOS_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

/** 웹 푸시를 지원하지 않는 브라우저로 만든다. 판정이 `PushManager` 의 존재만 본다. */
export async function 푸시를_지원하지_않게_한다(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Reflect.deleteProperty(globalThis, 'PushManager');
  });
}

/**
 * 홈 화면에서 열린 것으로 만든다. `display-mode: standalone` 이 그 신호다.
 *
 * <p>Playwright 의 `emulateMedia` 는 이 질의를 다루지 않아 `matchMedia` 를 갈아 끼운다.
 * 다른 질의는 원본에 그대로 넘긴다. 화면의 반응형 판정이 같은 함수를 쓰기 때문이다.
 */
export async function 홈_화면에서_열린_것으로_한다(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const 원본 = globalThis.matchMedia.bind(globalThis);
    globalThis.matchMedia = (query: string): MediaQueryList => {
      if (!query.includes('display-mode: standalone')) return 원본(query);
      // 원본을 감싸는 것은 addEventListener 같은 나머지를 살려 두기 위해서다.
      return new Proxy(원본(query), {
        get(대상, 이름) {
          if (이름 === 'matches') return true;
          const 값 = Reflect.get(대상, 이름, 대상) as unknown;
          // 네이티브 메서드는 프록시를 this 로 받으면 거부하므로 원본에 묶어 둔다.
          return typeof 값 === 'function' ? 값.bind(대상) : 값;
        },
      });
    };
  });
}

/**
 * 이 기기의 알림 권한과, 사용자가 권한 요청에 어떻게 답하는지를 정한다.
 *
 * <p>헤드리스 Chromium 은 알림 권한을 늘 거절로 답하며 `grantPermissions` 로도 바뀌지 않는다.
 * 화면이 `Notification.permission` 하나로 갈리므로 그 값을 직접 정한다.
 *
 * @param 지금 화면이 뜰 때의 권한
 * @param 답 사용자가 권한 요청에 주는 답. 생략하면 `지금` 과 같아 요청이 상태를 바꾸지 않는다
 */
export async function 권한을_정한다(
  page: Page,
  지금: NotificationPermission,
  답?: NotificationPermission,
): Promise<void> {
  await page.addInitScript(([처음, 답]: [NotificationPermission, NotificationPermission]) => {
    const 정한다 = (값: NotificationPermission) =>
      Object.defineProperty(Notification, 'permission', { configurable: true, get: () => 값 });

    정한다(처음);
    // 브라우저는 한 번 답한 권한을 그대로 갖는다. 요청 뒤의 판정이 그 답을 읽어야 한다.
    Notification.requestPermission = () => {
      정한다(답);
      return Promise.resolve(답);
    };
  }, [지금, 답 ?? 지금] as [NotificationPermission, NotificationPermission]);
}

/**
 * 푸시 서비스에 닿지 않고 구독이 만들어진 것으로 한다.
 *
 * <p>실제 구독은 브라우저 제조사의 푸시 서비스로 나가며 헤드리스에서 성립하지 않는다. 서버까지의
 * 왕복은 그대로 두고 브라우저가 자리를 발급하는 대목만 가짜로 바꾼다.
 */
export async function 가짜_구독을_만들게_한다(page: Page, endpoint: string): Promise<void> {
  await page.addInitScript((자리: string) => {
    const keys = { p256dh: 'e2e-p256dh', auth: 'e2e-auth' };
    const 구독 = {
      endpoint: 자리,
      toJSON: () => ({ endpoint: 자리, keys }),
      unsubscribe: () => Promise.resolve(true),
    };
    PushManager.prototype.subscribe = () => Promise.resolve(구독 as unknown as PushSubscription);
  }, endpoint);
}
