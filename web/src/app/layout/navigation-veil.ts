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
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { Veil } from '@/shared/ui/veil';

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

  readonly visible = computed(() => this.veil().visible());

  constructor() {
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

function pathOf(url: string): string {
  return url.split('?')[0].split('#')[0];
}
