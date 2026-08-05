import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ApiError } from '@/shared/api';
import { SessionApi, SessionStore } from '@/shared/auth';

import { SocialEmailPage } from './social-email-page';

class 가짜세션API {
  이메일요청: string[] = [];
  확인인자: [string, string][] = [];
  이메일실패: ApiError | null = null;
  확인실패: ApiError | null = null;

  requestSocialEmail(email: string): Promise<{ verificationId: string }> {
    this.이메일요청.push(email);
    return this.이메일실패
      ? Promise.reject(this.이메일실패)
      : Promise.resolve({ verificationId: 'v-1' });
  }

  confirmSocialSignup(verificationId: string, code: string): Promise<void> {
    this.확인인자.push([verificationId, code]);
    return this.확인실패 ? Promise.reject(this.확인실패) : Promise.resolve();
  }
}

describe('SocialEmailPage', () => {
  let api: 가짜세션API;
  let fixture: ComponentFixture<SocialEmailPage>;
  let 이동경로: string[];

  beforeEach(async () => {
    api = new 가짜세션API();
    이동경로 = [];

    await TestBed.configureTestingModule({
      imports: [SocialEmailPage],
      providers: [
        provideRouter([]),
        { provide: SessionApi, useValue: api },
        {
          provide: SessionStore,
          useValue: { refresh: () => Promise.resolve({ userId: 'u-1' }) },
        },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation((url) => {
      이동경로.push(String(url));
      return Promise.resolve(true);
    });

    fixture = TestBed.createComponent(SocialEmailPage);
    await fixture.whenStable();
  });

  function 요소<T extends HTMLElement>(selector: string): T | null {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(selector);
  }

  function 입력(selector: string, value: string): void {
    const element = 요소<HTMLInputElement>(selector)!;
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  async function 제출(): Promise<void> {
    요소('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function 본문(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  async function 이메일보내기(): Promise<void> {
    입력('input[type="email"]', 'someone@example.com');
    await 제출();
  }

  it('AUTH-02·03 이메일 → 코드를 지나면 계정이 만들어지고 앱으로 간다', async () => {
    await 이메일보내기();
    입력('ui-otp-input input', '123456');
    await 제출();

    expect(api.이메일요청).toEqual(['someone@example.com']);
    expect(api.확인인자).toEqual([['v-1', '123456']]);
    expect(이동경로).toEqual(['/app']);
  });

  it('AUTH-02·03 중간 표를 화면이 들고 다니지 않는다', async () => {
    await 이메일보내기();

    // 표는 HttpOnly 쿠키로만 오간다(보안 검토 F1). 화면이 URL이나 폼에서 표를 받는 순간
    // 표를 주운 사람이 남의 제공자 신원을 선점할 수 있게 된다.
    expect(api.이메일요청).toEqual(['someone@example.com']);
    expect((fixture.nativeElement as HTMLElement).innerHTML).not.toContain('ticket');
  });

  it('AUTH-02·03 코드 다시 받기를 제공하지 않는다', async () => {
    await 이메일보내기();

    // 서버가 이메일 요청 응답에서 표 쿠키를 지우므로(F4) 같은 표로 두 번 요청할 수 없다.
    // 버튼을 두면 누를 때마다 실패하는 버튼이 된다.
    expect(본문()).not.toContain('다시 받기');
  });

  it('AUTH-05 코드가 오지 않는 경우를 계정 존재를 단정하지 않고 안내한다', async () => {
    await 이메일보내기();

    // 기존 계정이면 서버가 코드 대신 안내 메일을 보내고 응답은 똑같다 — 화면은 어느 쪽인지
    // 알 수 없고, 알 수 있는 척해서도 안 된다.
    expect(본문()).toContain('이미 가입된 주소라면');
    expect(본문()).toContain('기존에 쓰던 로그인 방법');
  });

  it('AUTH-02·03 표가 죽으면 폼을 치우고 시작점으로 안내한다', async () => {
    api.이메일실패 = new ApiError(
      'validation',
      '소셜 로그인을 처음부터 다시 시작해 주세요.',
      400,
      'AUTH_SOCIAL_TICKET_INVALID',
    );

    await 이메일보내기();

    // 입력을 고쳐도 통과하지 못하는 상태다 — 폼을 남기면 같은 실패를 반복하게 된다
    expect(요소('input[type="email"]')).toBeNull();
    expect(본문()).toContain('처음부터 다시 시작해 주세요');
  });

  it('AUTH-02·03 코드가 틀리면 코드 입력에 머문다', async () => {
    api.확인실패 = new ApiError(
      'validation',
      '확인 코드가 올바르지 않습니다.',
      400,
      'AUTH_OTP_INVALID',
    );

    await 이메일보내기();
    입력('ui-otp-input input', '111111');
    await 제출();

    expect(요소('ui-otp-input')).toBeTruthy();
    expect(본문()).toContain('확인 코드가 올바르지 않습니다.');
    expect(이동경로).toEqual([]);
  });
});
