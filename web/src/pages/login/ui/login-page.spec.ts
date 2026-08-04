import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ApiError } from '@/shared/api';
import { SessionApi, SessionStore } from '@/shared/auth';

import { LoginPage } from './login-page';

class 가짜세션API {
  로그인인자: [string, string][] = [];
  실패: ApiError | null = null;

  login(email: string, password: string): Promise<{ userId: string; expiresAt: string }> {
    this.로그인인자.push([email, password]);
    return this.실패
      ? Promise.reject(this.실패)
      : Promise.resolve({ userId: 'u-1', expiresAt: '2026-09-01T00:00:00Z' });
  }
}

describe('LoginPage', () => {
  let api: 가짜세션API;
  let fixture: ComponentFixture<LoginPage>;
  let 이동경로: string[];

  beforeEach(async () => {
    api = new 가짜세션API();
    이동경로 = [];

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: SessionApi, useValue: api },
        { provide: SessionStore, useValue: { refresh: () => Promise.resolve(null) } },
      ],
    }).compileComponents();

    // RouterLink가 실제 Router를 쓰므로 통째로 가짜를 넣지 않고 이동만 가로챈다
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation((url) => {
      이동경로.push(String(url));
      return Promise.resolve(true);
    });

    fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
  });

  function 입력(selector: string, value: string): void {
    const element = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      selector,
    );
    element!.value = value;
    element!.dispatchEvent(new Event('input'));
  }

  async function 자격입력후제출(): Promise<void> {
    입력('input[type="email"]', 'someone@example.com');
    입력('input[type="password"]', 'password1234');
    await 제출();
  }

  async function 제출(): Promise<void> {
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')!
      .dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function 본문(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('AUTH-01 이메일·비밀번호로 로그인하면 앱으로 이동한다', async () => {
    await 자격입력후제출();

    expect(api.로그인인자).toEqual([['someone@example.com', 'password1234']]);
    expect(이동경로).toEqual(['/app']);
  });

  it('AUTH-01 로그인 실패는 사유를 추측하지 않고 서버 문구를 그대로 보여준다', async () => {
    // 서버가 "이메일 없음"과 "비밀번호 틀림"을 구분하지 않는데 화면이 친절을 더하면
    // 그 순간 계정 열거 오라클이 된다.
    api.실패 = new ApiError(
      'unauthorized',
      '이메일 또는 비밀번호를 확인해 주세요.',
      401,
      'AUTH_INVALID_CREDENTIALS',
    );

    await 자격입력후제출();

    expect(본문()).toContain('이메일 또는 비밀번호를 확인해 주세요.');
    expect(이동경로).toEqual([]);
  });

  it('입력이 비어 있으면 서버를 부르지 않고 칸마다 오류를 보여준다', async () => {
    await 제출();

    expect(api.로그인인자).toEqual([]);
    expect(본문()).toContain('이메일을 입력해 주세요.');
    expect(본문()).toContain('비밀번호를 입력해 주세요.');
  });

  it('returnUrl이 있으면 로그인 후 그곳으로 돌아간다', async () => {
    fixture.componentRef.setInput('returnUrl', '/app/devices');

    await 자격입력후제출();

    expect(이동경로).toEqual(['/app/devices']);
  });

  it('바깥으로 나가는 returnUrl은 따르지 않는다', async () => {
    // 링크 한 줄로 심을 수 있는 값이다 — 검사 없이 넘기면 우리 도메인을 거쳐 외부로
    // 보내는 오픈 리다이렉트가 된다. `//`와 `/\`는 프로토콜 상대 URL로 해석된다.
    for (const 악성 of ['https://evil.example', '//evil.example', '/\\evil.example']) {
      이동경로.length = 0;
      fixture.componentRef.setInput('returnUrl', 악성);

      await 자격입력후제출();

      expect(이동경로).toEqual(['/app']);
    }
  });

  it('세션 확인 실패로 되돌아온 경우에만 그 사유를 안내한다', async () => {
    expect(본문()).not.toContain('세션을 확인하지 못했습니다');

    fixture.componentRef.setInput('reason', 'unavailable');
    await fixture.whenStable();

    expect(본문()).toContain('세션을 확인하지 못했습니다');
  });
});
