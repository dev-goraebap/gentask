import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ApiError } from '@/shared/api';
import { SessionStore } from '@/shared/auth';

import { SocialCompletePage } from './social-complete-page';

class 가짜세션저장소 {
  결과: { userId: string } | null | Error = { userId: 'u-1' };
  갱신횟수 = 0;

  refresh(): Promise<{ userId: string } | null> {
    this.갱신횟수 += 1;
    return this.결과 instanceof Error ? Promise.reject(this.결과) : Promise.resolve(this.결과);
  }
}

describe('SocialCompletePage', () => {
  let store: 가짜세션저장소;
  let 이동경로: string[];

  async function 화면(): Promise<ComponentFixture<SocialCompletePage>> {
    const fixture = TestBed.createComponent(SocialCompletePage);
    await fixture.whenStable();
    return fixture;
  }

  beforeEach(async () => {
    store = new 가짜세션저장소();
    이동경로 = [];

    await TestBed.configureTestingModule({
      imports: [SocialCompletePage],
      providers: [provideRouter([]), { provide: SessionStore, useValue: store }],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation((url) => {
      이동경로.push(String(url));
      return Promise.resolve(true);
    });
  });

  it('AUTH-02·03 서버가 심은 세션을 확인하고 앱으로 넘긴다', async () => {
    await 화면();

    // 여기서 로그인 API를 다시 부르지 않는다 — 세션은 이미 쿠키로 와 있다
    expect(store.갱신횟수).toBe(1);
    expect(이동경로).toEqual(['/app']);
  });

  it('AUTH-02·03 세션이 없으면 앱으로 보내지 않고 다시 로그인하게 한다', async () => {
    store.결과 = null;
    const fixture = await 화면();

    expect(이동경로).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '로그인을 마치지 못했습니다',
    );
  });

  it('세션 확인이 실패해도 같은 처방을 준다', async () => {
    store.결과 = new ApiError('server', '서버 오류', 503);
    const fixture = await 화면();

    // 사용자가 할 수 있는 일은 다시 시도뿐이라 사유를 갈라 봐야 바뀌는 것이 없다
    expect(이동경로).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('다시 로그인해 주세요');
  });
});
