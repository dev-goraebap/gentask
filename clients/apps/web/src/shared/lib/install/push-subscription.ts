/**
 * 브라우저의 푸시 구독을 다룬다. 서버와 주고받는 것은 이 파일 밖의 서비스가 맡고, 여기는 브라우저
 * API 만 감싼다.
 */

/**
 * 서버가 준 base64url 공개 키를 브라우저가 요구하는 바이트 배열로 옮긴다.
 *
 * 버퍼 타입을 `ArrayBuffer` 로 못박는 것은 `applicationServerKey` 가 `SharedArrayBuffer` 를 받지
 * 않기 때문이다. 기본 `Uint8Array` 는 둘 다 될 수 있어 타입이 맞지 않는다.
 */
function toApplicationServerKey(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

export interface PushSubscriptionKeys {
  readonly endpoint: string;
  readonly p256dh: string;
  readonly auth: string;
}

function toKeys(subscription: PushSubscription): PushSubscriptionKeys {
  const json = subscription.toJSON();
  const keys = json.keys ?? {};
  return { endpoint: subscription.endpoint, p256dh: keys['p256dh'] ?? '', auth: keys['auth'] ?? '' };
}

/** 푸시 알림 수신을 위한 서비스 워커를 등록한다. */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

/** 이미 구독되어 있으면 그것을, 아니면 아무것도 내지 않는다. 권한을 묻지 않는다. */
export async function currentSubscription(): Promise<PushSubscriptionKeys | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in globalThis)) return null;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? toKeys(subscription) : null;
}

export type SubscribeResult =
  | { readonly status: 'subscribed'; readonly keys: PushSubscriptionKeys }
  /** 사용자가 권한을 거절했다. 브라우저가 다시 묻지 않으므로 설정에서 바꿔야 한다. */
  | { readonly status: 'denied' };

/**
 * 사용자 권한을 요청하고 브라우저 푸시 엔드포인트를 구독한다.
 */
export async function subscribe(publicKey: string): Promise<SubscribeResult> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { status: 'denied' };
  }
  const registration = await ensureServiceWorker();
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return { status: 'subscribed', keys: toKeys(existing) };
  }
  const created = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: toApplicationServerKey(publicKey),
  });
  return { status: 'subscribed', keys: toKeys(created) };
}

/**
 * 웹 푸시 구독을 해제하고 구독 해제된 엔드포인트를 반환한다.
 */
export async function unsubscribe(): Promise<string | null> {
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return null;

  const { endpoint } = subscription;
  await subscription.unsubscribe();
  return endpoint;
}
