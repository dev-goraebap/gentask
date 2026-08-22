import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

const STORAGE_KEY = 'sidebar';

/**
 * 사이드바의 접힘 상태를 소유합니다.
 *
 * 넓은 화면에서만 뜻이 있습니다. 좁은 화면의 네비게이션은 하단 탭이라 접을 것이 없습니다.
 * 선택은 저장소에 남기고 부트스트랩 시점에 복원합니다. 06-layout.md 3.4절. 복원 시점과
 * 깜빡임에 대한 전제는 `ThemeStore` 와 같습니다.
 */
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
      // 기본값(펼침)은 저장하지 않습니다. 저장소에 있는 것은 기본에서 벗어난 선택뿐입니다.
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
