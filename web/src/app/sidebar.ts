import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

const STORAGE_KEY = 'sidebar';

@Injectable({ providedIn: 'root' })
export class SidebarStore {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal(false);

  readonly collapsed = this.state.asReadonly();

  constructor() {
    if (!this.isBrowser) return;
    this.state.set(this.read());
  }

  toggle(): void {
    const next = !this.state();
    this.state.set(next);
    if (!this.isBrowser) return;

    try {
      if (next) this.document.defaultView?.localStorage.setItem(STORAGE_KEY, 'collapsed');
      else this.document.defaultView?.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 저장소를 쓸 수 없어도 이번 세션의 전환은 동작해야 합니다.
    }
  }

  private read(): boolean {
    try {
      return this.document.defaultView?.localStorage.getItem(STORAGE_KEY) === 'collapsed';
    } catch {
      return false;
    }
  }
}
