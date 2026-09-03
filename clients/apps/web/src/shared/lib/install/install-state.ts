import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

/** 이 기기에서 알림을 켤 수 있는가, 켤 수 없다면 왜인가. */
export type InstallState =
  /** 홈 화면에서 열렸거나 설치 없이도 알림을 받을 수 있다. */
  | 'ready'
  /** iOS 이고 브라우저 탭이다. 홈 화면에 추가하면 받을 수 있다. */
  | 'needs-install'
  /** 이 브라우저는 웹 푸시를 지원하지 않는다. 설치로도 해결되지 않는다. */
  | 'unsupported';

/**
 * 홈 화면에서 열렸는지 판정한다.
 *
 * 표준은 `display-mode: standalone` 미디어 질의이나 iOS Safari 는 그것을 갖지 않는 판이 있어
 * 비표준 `navigator.standalone` 을 함께 본다.
 */
function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  // globalThis 로 읽는 것은 서버에도 있는 이름이기 때문이다. window 는 서버에서 참조만 해도 터진다.
  return iosStandalone === true || globalThis.matchMedia('(display-mode: standalone)').matches;
}

function isIos(): boolean {
  // iPadOS 13 부터 사파리가 자신을 Macintosh 로 알리므로 터치 지원 여부를 함께 본다.
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function resolveInstallState(): InstallState {
  if (!('serviceWorker' in navigator) || !('PushManager' in globalThis)) {
    // iOS Safari는 홈 화면에 설치되기 전까지 PushManager API를 지원하지 않는다.
    // 설치하면 되는 것을 가르지 않으면, 설치하면 되는 사용자에게 안 된다고 알리게 된다.
    return isIos() && !isStandalone() ? 'needs-install' : 'unsupported';
  }
  if (isIos() && !isStandalone()) {
    return 'needs-install';
  }
  return 'ready';
}

/** 서버에서는 판정할 수 없으므로 브라우저에서만 부른다. 서버 렌더 중에는 `unsupported` 로 둔다. */
export function injectInstallState(): () => InstallState {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  return () => (isBrowser ? resolveInstallState() : 'unsupported');
}
