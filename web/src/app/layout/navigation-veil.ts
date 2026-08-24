import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router,
} from '@angular/router';
import { Veil } from '@/shared/ui/veil';

/**
 * 화면 전환 중 콘텐츠 영역을 덮습니다.
 *
 * 이 대기는 데이터가 아니라 다음 화면의 코드(지연 청크)를 기다리는 것입니다. 데이터
 * 대기는 각 화면이 자기 조회의 상태로 베일을 띄웁니다. 10-loading.md 2절.
 *
 * 무엇이 전환인지의 판정만 여기 있고 시간 정책과 가림막은 베일 컴포넌트가 갖습니다.
 * 경로가 바뀌면 베일이고 쿼리만 바뀌면 인디케이터입니다. 사람이 "이건 전환인가 갱신인가"를
 * 판단하지 않고 URL 의 경로 부분을 비교해 계산합니다(3.1절). 필터를 쿼리 파라미터에
 * 두기로 한 결정이 이 판정을 성립시킵니다.
 */
@Component({
  selector: 'app-navigation-veil',
  imports: [Veil],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-veil [loading]="pending()" [failed]="failed()" />`,
})
export class NavigationVeil {
  private readonly router = inject(Router);

  protected readonly pending = signal(false);

  protected readonly failed = signal(false);

  private readonly veil = viewChild.required(Veil);

  /** 베일이 실제로 떠 있는지입니다. 셸이 `aria-busy` 를 붙일 때 이 값을 읽습니다. */
  readonly visible = computed(() => this.veil().visible());

  constructor() {
    // 서버에는 전환이 없습니다. 05-rendering.md 2.2절.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (pathOf(event.url) !== pathOf(this.router.url)) {
          this.failed.set(false);
          this.pending.set(true);
        }
        return;
      }

      if (event instanceof NavigationError) {
        this.pending.set(false);
        this.failed.set(true);
        return;
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        this.pending.set(false);
      }
    });
  }
}

/** 쿼리와 프래그먼트를 떼어 경로만 남깁니다. */
function pathOf(url: string): string {
  return url.split('?')[0].split('#')[0];
}
