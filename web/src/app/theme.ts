import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/**
 * 사용자가 고를 수 있는 색상 모드입니다.
 *
 * `system` 을 별도 값으로 두는 이유는 "시스템을 따른다"와 "마침 시스템과 같은 것을 골랐다"가
 * 다른 상태이기 때문입니다. 둘을 합치면 시스템 설정이 바뀌었을 때 따라가야 할지 판정할 수 없습니다.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme';
const ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

/**
 * 색상 모드의 사용자 선택을 소유합니다.
 *
 * 전환 판단의 원본은 `color-scheme` 이며 기본값은 시스템 설정입니다. 사용자가 고르면
 * 문서 루트에 클래스를 붙여 그 판정을 덮습니다. 클래스 부여 로직을 `app` 계층이 갖는 것은
 * docs/architecture/references/04-design-system.md 7절이 정한 바입니다.
 *
 * 시스템 설정만 따르는 동안에는 CSS 의 `light-dark()` 가 혼자 처리하므로 깜빡임이 없습니다.
 * 사용자 선택은 부트스트랩 시점에 복원되며, 지금 화면이 전부 클라이언트 렌더링이라
 * 그 시점 이전에 그려진 내용이 없어 역시 깜빡이지 않습니다.
 *
 * 정적 생성 경로가 생기면 이야기가 달라집니다. 서버가 사용자 선택을 알 수 없어
 * 시스템 모드로 그려진 HTML 이 먼저 보이고 부트스트랩 후에 뒤집힙니다. 그때는 첫 페인트
 * 전에 클래스를 붙이는 수단이 필요하며, 인라인 스크립트는 16-security.md 4절이 금지하므로
 * 해시 기반 CSP 를 함께 정하거나 그 경로에서 전환을 제공하지 않는 쪽을 골라야 합니다.
 */
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<ThemePreference>('system');

  readonly preference = this.state.asReadonly();

  constructor() {
    // 서버에는 저장소도 문서 루트의 클래스도 의미가 없습니다. 05-rendering.md 2절.
    if (!this.isBrowser) return;

    const stored = this.read();
    if (stored) this.state.set(stored);

    effect(() => this.apply(this.state()));
  }

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

  /** 시스템 → 라이트 → 다크 → 시스템 순으로 돕니다. */
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
