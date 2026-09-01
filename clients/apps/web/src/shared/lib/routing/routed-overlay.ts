import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { EnvironmentInjector, inject, type Type } from '@angular/core';
import { Router } from '@angular/router';

/**
 * 덮개의 표면.
 *
 * <p>좁은 화면에서는 화면을 통째로 채워 셸까지 덮고, 넓은 화면에서는 가운데 상자가 된다. 좁은 쪽에
 * 높이를 고정하는 것은 내용이 짧을 때 덮개가 화면 가운데 뜬 작은 상자가 되기 때문이다 — 셸을 덮는
 * 것이 이 자리의 목적이므로 내용의 길이와 무관하게 채운다.
 *
 * <p>라우트를 고르는 판정은 이동하는 그 순간에 한 번뿐이므로 그 뒤의 크기 변화는 이 스타일이
 * 받는다. 여기서 DOM 을 갈아 끼우면 창을 줄이는 동안 적던 것이 사라진다.
 *
 * <p>CDK 가 판과 내용 사이에 그릇을 한 겹 더 둔다. 그것이 `block` 이라 판이 화면 높이를 채워도
 * 안쪽은 내용 높이에 멈추고, 바닥에 붙어야 할 것이 내용 바로 뒤에 선다. 그 겹을 세로 흐름에
 * 잇는다.
 */
const PANEL =
  'bg-background border-border relative flex h-dvh w-screen flex-col overflow-hidden outline-none [&>.cdk-dialog-container]:flex [&>.cdk-dialog-container]:min-h-0 [&>.cdk-dialog-container]:flex-1 [&>.cdk-dialog-container]:flex-col md:h-auto md:max-h-[85dvh] md:w-[36rem] md:border md:shadow-lg';

const BACKDROP = 'bg-veil';

export interface RoutedOverlayRef<T> {
  readonly instance: T;

  /**
   * 덮개를 닫고 그 자리를 떠난다.
   *
   * <p>갈 곳을 주지 않으면 열기 전의 자리로 돌아간다. 배경을 누르거나 Esc 로 닫아도 같은 자리로
   * 간다 — 덮개가 닫혔는데 주소가 덮개를 가리킨 채 남으면 새로고침에 다시 열린다.
   */
  close(target?: string): void;

  /**
   * 이동 없이 덮개만 걷는다.
   *
   * <p>주소가 먼저 바뀐 경우에 쓴다. 뒤로가기로 덮개를 닫으면 주소는 이미 열기 전으로 돌아가 있고,
   * 그때 [close] 를 부르면 같은 자리로 한 번 더 이동해 히스토리가 어긋난다.
   */
  dismiss(): void;
}

export interface RoutedOverlay {
  open<T>(component: Type<T>, returnTo: string): RoutedOverlayRef<T>;
}

/**
 * 라우트가 띄우는 덮개.
 *
 * <p>여는 것은 주소를 쌓고 닫는 것은 갈아 끼운다. 뒤로가기가 덮개를 닫아야 하고, 닫기로 닫은 뒤의
 * 뒤로가기가 덮개를 다시 열면 안 되기 때문이다.
 */
export function injectRoutedOverlay(): RoutedOverlay {
  const dialog = inject(Dialog);
  const router = inject(Router);
  const overlay = inject(Overlay);
  /*
   * 라우트가 세운 환경 인젝터를 넘긴다. 넘기지 않으면 CDK 가 뿌리 인젝터로 덮개의 내용을 세우므로
   * 라우트의 `providers` 가 닿지 않고, 그 자리의 서비스를 주입하는 순간 NG0201 로 터진다.
   *
   * <p>그릇(`ViewContainerRef`)을 대신 넘기지 않는다. 그러면 CDK 가 부르는 컴포넌트의 뷰 안에
   * 내용을 만들어 그 DOM 이 오버레이가 아니라 화면 안에 남는다. 판은 높이 0 인 선이 되고 포커스는
   * `aria-hidden` 이 걸린 자리에 갇힌다.
   */
  const injector = inject(EnvironmentInjector);

  return {
    open<T>(component: Type<T>, returnTo: string): RoutedOverlayRef<T> {
      const ref = dialog.open<unknown, undefined, T>(component, {
        injector,
        /*
         * 배경 스크롤을 잠그지 않는다. CDK 의 기본값은 잠그는 것이고 그 구현이 `<html>` 을
         * `position: fixed` 로 만드는데, 셸이 이미 화면 높이를 채우고 안쪽이 스크롤하는 구조라
         * 그 순간 레이아웃이 통째로 밀린다. 덮개가 화면을 채우므로 잠글 것도 없다.
         */
        scrollStrategy: overlay.scrollStrategies.noop(),
        panelClass: PANEL.split(' '),
        backdropClass: BACKDROP.split(' '),
        autoFocus: 'first-tabbable',
      });

      // 갈 곳을 하나만 두고 닫히는 순간에 읽는다. 닫으면서 따로 이동하면 두 이동이 경쟁한다.
      let target: string | null = returnTo;
      ref.closed.subscribe(() => {
        if (target !== null) void router.navigateByUrl(target, { replaceUrl: true });
      });

      return {
        instance: ref.componentInstance as T,
        close(next?: string): void {
          if (next !== undefined) target = next;
          ref.close();
        },
        dismiss(): void {
          target = null;
          ref.close();
        },
      };
    },
  };
}
