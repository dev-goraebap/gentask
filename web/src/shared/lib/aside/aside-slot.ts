import { Directive, inject, Injectable, type OnDestroy, signal, TemplateRef } from '@angular/core';

/**
 * 레이아웃의 오른쪽 `aside` 슬롯입니다.
 *
 * 슬롯은 셸이 소유하고 내용은 화면이 냅니다. 셸이 라우트를 보고 직접 그리면 특정 화면의
 * 세부 구조를 알게 되어 06-layout.md 3.1절의 캡슐화가 무너지고, 반대로 화면이 자기
 * 레이아웃을 정하면 같은 문서 9절의 금지에 걸립니다. 그래서 셸은 슬롯이 찼는지만 알고
 * 무엇이 들었는지는 모릅니다.
 *
 * 이 서비스가 `shared` 에 있는 이유는 계층 방향 때문입니다. 셸은 `app` 이고 화면은
 * `pages` 라 둘이 함께 참조할 수 있는 자리가 `shared` 뿐입니다. 02-package-structure.md 5절.
 *
 * 템플릿으로 주고받으므로 내용의 인젝터는 선언 위치인 화면입니다. 라우트가 제공한
 * 프로바이더가 그대로 닿습니다. 01-dev-environment.md 7절.
 */
@Injectable({ providedIn: 'root' })
export class AsideSlot {
  private readonly state = signal<TemplateRef<unknown> | null>(null);

  /** 셸이 읽습니다. null 이면 슬롯을 그리지 않습니다. */
  readonly content = this.state.asReadonly();

  set(template: TemplateRef<unknown>): void {
    this.state.set(template);
  }

  /** 낸 화면이 거둡니다. 다른 화면이 이미 채웠으면 건드리지 않습니다. */
  clear(template: TemplateRef<unknown>): void {
    if (this.state() === template) this.state.set(null);
  }
}

/**
 * 화면이 `aside` 슬롯에 낼 내용을 표시합니다.
 *
 * ```html
 * <ng-template appAside>
 *   <app-task-detail-panel [id]="openId" />
 * </ng-template>
 * ```
 *
 * 슬롯을 비우려면 이 템플릿을 `@if` 로 감쌉니다. 조건이 거짓이 되면 디렉티브가 파괴되며
 * 등록을 스스로 거둡니다.
 */
@Directive({ selector: '[appAside]' })
export class AsideOutlet implements OnDestroy {
  private readonly slot = inject(AsideSlot);
  private readonly template = inject<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    this.slot.set(this.template);
  }

  ngOnDestroy(): void {
    this.slot.clear(this.template);
  }
}
