import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme';
const ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly state = signal<ThemePreference>('system');
  readonly preference = this.state.asReadonly();

  // --- 생성 --------------------------------------------------------------------------------------
  constructor() {
    if (!this.isBrowser) return;

    const stored = this.read();
    if (stored) this.state.set(stored);

    effect(() => this.apply(this.state()));
  }

  // --- 동작 --------------------------------------------------------------------------------------
  select(next: ThemePreference): void {
    this.state.set(next);
    if (!this.isBrowser) return;

    try {
      if (next === 'system') this.document.defaultView?.localStorage.removeItem(STORAGE_KEY);
      else this.document.defaultView?.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 저장소를 쓸 수 없는 환경에서도 이번 세션의 전환은 동작해야 합니다.
    }
  }

  cycle(): void {
    const at = ORDER.indexOf(this.state());
    this.select(ORDER[(at + 1) % ORDER.length]);
  }

  private read(): ThemePreference | null {
    try {
      const raw = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return raw === 'light' || raw === 'dark' ? raw : null;
    } catch {
      return null;
    }
  }

  private apply(preference: ThemePreference): void {
    const root = this.document.documentElement.classList;
    root.toggle('light', preference === 'light');
    root.toggle('dark', preference === 'dark');
  }
}
