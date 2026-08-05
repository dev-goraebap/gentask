import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ApiError } from '@/shared/api';
import { SessionApi, SessionStore } from '@/shared/auth';

import { AccountRecoveryPage } from './account-recovery-page';

class 가짜세션API {
  발급인자: string[] = [];
  확인인자: [string, string][] = [];
  확인실패: ApiError | null = null;
  비밀번호없음 = false;

  issueAccountRecovery(email: string): Promise<{ verificationId: string }> {
    this.발급인자.push(email);
    return Promise.resolve({ verificationId: 'v-1' });
  }

  confirmAccountRecovery(
    verificationId: string,
    code: string,
  ): Promise<{ userId: string; sessionExpiresAt: string; shouldSetPassword: boolean }> {
    this.확인인자.push([verificationId, code]);
    return this.확인실패
      ? Promise.reject(this.확인실패)
      : Promise.resolve({
          userId: 'u-1',
          sessionExpiresAt: '2026-09-01T00:00:00Z',
          shouldSetPassword: this.비밀번호없음,
        });
  }
}

describe('AccountRecoveryPage', () => {
  let api: 가짜세션API;
  let fixture: ComponentFixture<AccountRecoveryPage>;
  let 이동경로: string[];

  beforeEach(async () => {
    api = new 가짜세션API();
    이동경로 = [];

    await TestBed.configureTestingModule({
      imports: [AccountRecoveryPage],
      providers: [
        provideRouter([]),
        { provide: SessionApi, useValue: api },
        { provide: SessionStore, useValue: { refresh: () => Promise.resolve({ userId: 'u-1' }) } },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation((url) => {
      이동경로.push(String(url));
      return Promise.resolve(true);
    });

    fixture = TestBed.createComponent(AccountRecoveryPage);
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

  async function 코드받기(): Promise<void> {
    입력('input[type="email"]', 'someone@example.com');
    await 제출();
  }

  it('AUTH-08 이메일과 코드로 로그인된다', async () => {
    await 코드받기();
    입력('ui-otp-input input', '123456');
    await 제출();

    expect(api.발급인자).toEqual(['someone@example.com']);
    expect(api.확인인자).toEqual([['v-1', '123456']]);
    expect(이동경로).toEqual(['/app']);
  });

  it('AUTH-08 비밀번호 없는 계정에는 설정을 권하되 없는 경로를 약속하지 않는다', async () => {
    api.비밀번호없음 = true;

    await 코드받기();
    입력('ui-otp-input input', '123456');
    await 제출();

    // 그대로 나가면 다음에 또 복구를 해야 하므로 안내한다(AUTH-08).
    // 다만 설정 기능(PROF-03)이 아직 없으므로 그리로 보내는 링크를 만들지 않는다.
    expect(본문()).toContain('비밀번호가 없습니다');
    expect(본문()).toContain('준비 중');
    expect(이동경로).toEqual([]);
  });

  it('AUTH-08 비밀번호가 있는 계정은 안내 없이 앱으로 보낸다', async () => {
    await 코드받기();
    입력('ui-otp-input input', '123456');
    await 제출();

    // 안내할 것이 없는 사용자를 한 번 더 세우면 그것이 곧 마찰이다
    expect(본문()).not.toContain('준비 중');
    expect(이동경로).toEqual(['/app']);
  });

  it('AUTH-08 코드가 틀리면 코드 입력에 머문다', async () => {
    api.확인실패 = new ApiError(
      'validation',
      '확인 코드가 올바르지 않습니다.',
      400,
      'AUTH_OTP_INVALID',
    );

    await 코드받기();
    입력('ui-otp-input input', '111111');
    await 제출();

    expect(요소('ui-otp-input')).toBeTruthy();
    expect(본문()).toContain('확인 코드가 올바르지 않습니다.');
    expect(이동경로).toEqual([]);
  });
});
