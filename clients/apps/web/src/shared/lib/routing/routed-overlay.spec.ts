import { Component, inject, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { injectRoutedOverlay } from './routed-overlay';

/** 라우트의 `providers` 에만 있는 서비스. 환경 인젝터에는 없다. */
@Injectable()
class ScopedStub {
  readonly mark = '라우트에서 왔다';
}

@Component({ selector: 'app-content-stub', template: `{{ scopedStub.mark }}` })
class ContentStub {
  readonly scopedStub = inject(ScopedStub);
}

@Component({ selector: 'app-host-stub', template: `` })
class HostStub {
  private readonly overlay = injectRoutedOverlay();

  constructor() {
    this.overlay.open(ContentStub, '/');
  }
}

@Component({ selector: 'app-parent-stub', imports: [RouterOutlet], template: `<router-outlet />` })
class ParentStub {}

describe('injectRoutedOverlay', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  async function open(): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'list',
            component: ParentStub,
            providers: [ScopedStub],
            children: [{ path: 'new', component: HostStub }],
          },
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/list/new');
  }

  /*
   * 스크롤 잠금을 끄는 것은 이 검사가 덮지 못한다. CDK 는 문서가 실제로 스크롤될 때만 잠그는데 이
   * 환경에서는 그 조건이 서지 않아, 기본값이어도 검사가 통과한다. 규칙은 FE-STY-186 이 갖는다.
   */

  it('덮개 안의 컴포넌트가 라우트 스코프 프로바이더에 닿습니다', async () => {
    await open();

    /*
     * 오버레이 판 안에서 찾는다. 문서 전체에서 찾으면 내용이 화면 안에 남아 판이 빈 채로 뜨는
     * 어긋남을 놓친다 — 그릇을 넘겼을 때 실제로 그렇게 되며, 그때도 문서에는 글자가 있다.
     */
    const pane = document.querySelector('.cdk-overlay-container .cdk-overlay-pane');

    expect(pane?.textContent).toContain('라우트에서 왔다');
  });
});
