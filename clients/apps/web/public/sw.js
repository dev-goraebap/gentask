// 알림을 받기 위한 서비스 워커. 푸시 메시지는 이 자리로만 오므로 이것 없이는 알림이 성립하지 않는다.
//
// 캐싱을 하지 않는다. 알림이 요구하지 않으며, 이 앱은 SSR 로 셸을 내려받으므로 여기서 자산을
// 캐시하면 오래된 셸이 남는다. 오프라인 동작은 TG-007 의 범위 밖이다.

self.addEventListener('install', () => {
  // 앞의 워커를 기다리지 않고 곧바로 선다. 캐시를 갖지 않아 버릴 것이 없다.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const payload = readPayload(event);
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-maskable-192.png',
      tag: payload.tag,
      data: { url: payload.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;

  // 이미 열린 창이 있으면 그것을 앞으로 가져온다. 새 창을 매번 열면 같은 앱이 여럿 뜬다.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const opened = clients.find((client) => client.url === target);
      if (opened) return opened.focus();
      return self.clients.openWindow(target);
    }),
  );
});

/** 페이로드가 없거나 JSON 이 아닐 수 있다. 그때도 알림은 떠야 한다. */
function readPayload(event) {
  const fallback = { title: 'gentask', body: '알림이 도착했습니다.', tag: undefined, url: '/' };
  if (!event.data) return fallback;
  try {
    return { ...fallback, ...event.data.json() };
  } catch {
    return { ...fallback, body: event.data.text() };
  }
}
