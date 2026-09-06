import { Button, Text } from '@astryxdesign/core';
import { useEffect, useState } from 'react';
import { api, type PushConfigView, type PushSubscriptionStateView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * VAPID 공개 키는 base64url 로 온다. 브라우저는 바이트 배열을 받는다.
 *
 * ArrayBuffer 로 돌려주는 것은 Uint8Array 의 버퍼 타입이 최근 표준에서 좁아져
 * applicationServerKey 에 그대로 넣지 못하기 때문이다.
 */
function toBytes(base64url: string): ArrayBuffer {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes.buffer;
}

/**
 * 알림 구독을 켜고 끈다.
 *
 * 서비스 워커가 없으면 푸시가 닿을 자리가 없으므로 먼저 등록한다. 권한은 사용자가 주는 것이라
 * 거절되면 그대로 알린다.
 */
export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in globalThis;
    setSupported(ok);
    if (!ok) return;
    void api
      .get<PushSubscriptionStateView>(ENDPOINTS.pushSubscription)
      .then((state) => setRegistered(state.registered))
      .catch(() => setRegistered(false));
  }, []);

  const enable = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotice('알림 권한이 없습니다. 브라우저 설정에서 허용해야 합니다.');
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js');
      const config = await api.get<PushConfigView>(ENDPOINTS.pushConfig);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toBytes(config.publicKey),
      });
      await api.post(ENDPOINTS.pushSubscription, subscription.toJSON());
      setRegistered(true);
      setNotice('알림을 켰습니다.');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '알림을 켜지 못했습니다');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await api.delete(`${ENDPOINTS.pushSubscription}?endpoint=${encodeURIComponent(subscription.endpoint)}`);
        await subscription.unsubscribe();
      }
      setRegistered(false);
      setNotice('알림을 껐습니다.');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '알림을 끄지 못했습니다');
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return (
      <Text as="p" type="supporting" color="secondary">
        이 브라우저는 웹 푸시를 지원하지 않습니다.
      </Text>
    );
  }

  return (
    <>
      <Text as="p" type="supporting" color="secondary">
        {registered ? '이 기기에서 알림을 받습니다.' : '이 기기에서 알림을 받지 않습니다.'}
      </Text>
      <Button
        label={registered ? '알림 끄기' : '알림 켜기'}
        variant={registered ? 'secondary' : 'primary'}
        isLoading={busy}
        onClick={() => void (registered ? disable() : enable())}
      />
      {notice ? (
        <Text as="p" type="supporting" color="secondary">
          {notice}
        </Text>
      ) : null}
    </>
  );
}
