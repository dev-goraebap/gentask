import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';

const WAIT_DELAY = 200;

const WAIT_MIN = 400;

@Component({
  selector: 'app-veil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="bg-veil absolute inset-0 z-30" aria-hidden="true"></div>
    }
  `,
})
export class Veil {
  readonly loading = input.required<boolean>();

  readonly failed = input(false);

  private readonly shown = signal(false);

  readonly visible = this.shown.asReadonly();

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private shownAt = 0;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    inject(DestroyRef).onDestroy(() => this.clearTimers());

    effect(() => {
      if (this.failed()) {
        this.clearTimers();
        this.shown.set(false);
        return;
      }

      if (this.loading()) this.arm();
      else this.disarm();
    });
  }

  private arm(): void {
    this.clearTimers();
    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      this.shownAt = Date.now();
      this.shown.set(true);
    }, WAIT_DELAY);
  }

  private disarm(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
      return;
    }

    if (!this.shown()) return;

    const remaining = Math.max(0, WAIT_MIN - (Date.now() - this.shownAt));
    this.hideTimer = setTimeout(() => this.shown.set(false), remaining);
  }

  private clearTimers(): void {
    if (this.showTimer) clearTimeout(this.showTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.showTimer = null;
    this.hideTimer = null;
  }
}
