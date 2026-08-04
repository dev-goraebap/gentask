import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ApiError } from '@/shared/api';
import { SessionApi, SessionStore } from '@/shared/auth';

import { SignupPage } from './signup-page';

class 가짜세션API {
  발급인자: string[] = [];
  가입인자: [string, string, string][] = [];
  가입실패: ApiError | null = null;
  발급번호 = 0;

  issueSignupVerification(email: string): Promise<{ verificationId: string }> {
    this.발급인자.push(email);
    this.발급번호 += 1;
    return Promise.resolve({ verificationId: `v-${this.발급번호}` });
  }

  signup(
    verificationId: string,
    code: string,
    password: string,
  ): Promise<{ userId: string; email: string; sessionExpiresAt: string }> {
    this.가입인자.push([verificationId, code, password]);
    return this.가입실패
      ? Promise.reject(this.가입실패)
      : Promise.resolve({
          userId: 'u-1',
          email: 'someone@example.com',
          sessionExpiresAt: '2026-09-01T00:00:00Z',
        });
  }
}

describe('SignupPage', () => {
  let api: 가짜세션API;
  let fixture: ComponentFixture<SignupPage>;
  let 이동경로: string[];

  beforeEach(async () => {
    api = new 가짜세션API();
    이동경로 = [];

    await TestBed.configureTestingModule({
      imports: [SignupPage],
      providers: [
        provideRouter([]),
        { provide: SessionApi, useValue: api },
        { provide: SessionStore, useValue: { refresh: () => Promise.resolve(null) } },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation((url) => {
      이동경로.push(String(url));
      return Promise.resolve(true);
    });

    fixture = TestBed.createComponent(SignupPage);
    await fixture.whenStable();
  });

  function 요소<T extends HTMLElement>(selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(selector)!;
  }

  function 입력(selector: string, value: string): void {
    const element = 요소<HTMLInputElement>(selector);
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  async function 제출(): Promise<void> {
    요소('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function 본문(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  /** 1단계: 이메일 → 코드 발급 */
  async function 코드받기(): Promise<void> {
    입력('input[type="email"]', 'someone@example.com');
    await 제출();
  }

  /** 2단계: 6자리 코드 입력 → 다음 */
  async function 코드입력(code: string): Promise<void> {
    입력('ui-otp-input input', code);
    await 제출();
  }

  /** 3단계: 비밀번호 두 칸 */
  async function 비밀번호입력(password: string): Promise<void> {
    const 칸 = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    for (const element of Array.from(칸)) {
      element.value = password;
      element.dispatchEvent(new Event('input'));
    }
    await 제출();
  }

  it('AUTH-01 이메일 → 코드 → 비밀번호를 지나 가입이 완료된다', async () => {
    await 코드받기();
    expect(api.발급인자).toEqual(['someone@example.com']);
    // 오타를 알아챌 단서는 사용자가 입력한 주소뿐이다
    expect(본문()).toContain('someone@example.com');

    await 코드입력('123456');
    await 비밀번호입력('password1234');

    // 코드와 비밀번호가 한 호출로 검증된다 — 서버 계약이 둘을 나누지 않는다(서버.md §1.6)
    expect(api.가입인자).toEqual([['v-1', '123456', 'password1234']]);
    expect(이동경로).toEqual(['/app']);
  });

  it('AUTH-01 코드가 틀리면 비밀번호가 아니라 코드 입력으로 되돌린다', async () => {
    api.가입실패 = new ApiError(
      'validation',
      '확인 코드가 올바르지 않습니다.',
      400,
      'AUTH_OTP_INVALID',
    );

    await 코드받기();
    await 코드입력('111111');
    await 비밀번호입력('password1234');

    // 고칠 칸이 없는 화면에 오류만 띄우면 사용자가 할 수 있는 일이 없다
    expect(요소('ui-otp-input')).toBeTruthy();
    expect(본문()).toContain('확인 코드가 올바르지 않습니다.');
  });

  it('코드를 다시 받으면 새 대기 레코드로 가입한다', async () => {
    await 코드받기();

    const 재발송 = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('다시 받기'))!;
    재발송.click();
    await fixture.whenStable();

    await 코드입력('123456');
    await 비밀번호입력('password1234');

    // 이전 식별자를 계속 쓰면 재발송한 코드가 맞아도 검증에 실패한다
    expect(api.발급번호).toBe(2);
    expect(api.가입인자[0][0]).toBe('v-2');
  });

  it('6자리를 채우지 않으면 다음 단계로 넘어가지 않는다', async () => {
    await 코드받기();

    await 코드입력('123');

    expect(요소('ui-otp-input')).toBeTruthy();
    expect(본문()).toContain('6자리를 모두 입력해 주세요.');
  });

  it('비밀번호가 서로 다르면 서버를 부르지 않는다', async () => {
    await 코드받기();
    await 코드입력('123456');

    const 칸 = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    칸[0].value = 'password1234';
    칸[0].dispatchEvent(new Event('input'));
    칸[1].value = 'password9999';
    칸[1].dispatchEvent(new Event('input'));
    await 제출();

    expect(api.가입인자).toEqual([]);
    expect(본문()).toContain('비밀번호가 일치하지 않습니다.');
  });
});
