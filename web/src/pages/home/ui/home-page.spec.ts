import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SessionStore } from '@/shared/auth';

import { HomePage } from './home-page';

class 가짜세션저장소 {
  로그아웃횟수 = 0;

  logout(): Promise<void> {
    this.로그아웃횟수 += 1;
    return Promise.resolve();
  }
}

describe('HomePage', () => {
  let store: 가짜세션저장소;
  let fixture: ComponentFixture<HomePage>;
  let 이동경로: string[];

  beforeEach(async () => {
    store = new 가짜세션저장소();
    이동경로 = [];

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([]), { provide: SessionStore, useValue: store }],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation((url) => {
      이동경로.push(String(url));
      return Promise.resolve(true);
    });

    fixture = TestBed.createComponent(HomePage);
    fixture.componentRef.setInput('session', {
      userId: 'u-1',
      email: 'someone@example.com',
      nickname: null,
      expiresAt: '2026-09-01T00:00:00Z',
    });
    await fixture.whenStable();
  });

  function 본문(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('AUTH-01 리졸버가 넘긴 세션을 로딩 분기 없이 바로 그린다', () => {
    expect(본문()).toContain('someone@example.com');
  });

  it('AUTH-01 로그아웃하면 세션을 끊고 로그인 화면으로 보낸다', async () => {
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    await fixture.whenStable();

    expect(store.로그아웃횟수).toBe(1);
    expect(이동경로).toEqual(['/login']);
  });
});
