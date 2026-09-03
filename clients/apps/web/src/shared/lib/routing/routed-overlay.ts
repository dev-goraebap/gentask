import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { EnvironmentInjector, inject, type Type } from '@angular/core';
import { Router } from '@angular/router';

/**
 * 라우트 기반 오버레이 패널 스타일이다.
 * 반응형 스타일에 따라 모바일에서는 전체 화면을 채우고, 데스크톱에서는 중앙 모달 다이얼로그로 렌더링한다.
 */
const PANEL =
  'bg-background border-border relative flex h-dvh w-screen flex-col overflow-hidden outline-none [&>.cdk-dialog-container]:flex [&>.cdk-dialog-container]:min-h-0 [&>.cdk-dialog-container]:flex-1 [&>.cdk-dialog-container]:flex-col md:h-auto md:max-h-[85dvh] md:w-[36rem] md:border md:shadow-lg';

const BACKDROP = 'bg-veil';

export interface RoutedOverlayRef<T> {
  readonly instance: T;

  /**
   * 다이얼로그 오버레이를 닫고 이전 경로로 네비게이션한다.
   */
  close(target?: string): void;

  /**
   * 라우터 이동 없이 오버레이 뷰 인스턴스만 해제한다. 브라우저 뒤로가기 이벤트 수신 시 사용한다.
   */
  dismiss(): void;
}

export interface RoutedOverlay {
  open<T>(component: Type<T>, returnTo: string): RoutedOverlayRef<T>;
}

/**
 * 라우트 기반 모달 오버레이를 여는 서비스 팩토리 함수다.
 */
export function injectRoutedOverlay(): RoutedOverlay {
  const dialog = inject(Dialog);
  const router = inject(Router);
  const overlay = inject(Overlay);
  /*
   * 라우트별 providers 주입을 유지하기 위해 해당 라우트의 EnvironmentInjector를 전달한다.
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
