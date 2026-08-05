import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApiError } from '@/shared/api';
import { SessionApi, SessionStore } from '@/shared/auth';

import { PasswordResetPage } from './password-reset-page';

class 가짜세션API {
  발급인자: string[] = [];
  확인인자: [string, string, string][] = [];
  확인실패: ApiError | null = null;
  발급번호 = 0;

  issuePasswordReset(email: string): Promise<{ verificationId: string }> {
    this.발급인자.push(email);
    this.발급번호 += 1;
    return Promise.resolve({ verificationId: `v-${this.발급번호}` });
  }

  confirmPasswordReset(verificationId: string, code: string, newPassword: string): Promise<void> {
    this.확인인자.push([verificationId, code, newPassword]);
    return this.확인실패 ? Promise.reject(this.확인실패) : Promise.resolve();
  }
}

class 가짜세션저장소 {
  만료처리횟수 = 0;

  markExpired(): void {
    this.만료처리횟수 += 1;
  }
}

describe('PasswordResetPage', () => {
  let api: 가짜세션API;
  let store: 가짜세션저장소;
  let fixture: ComponentFixture<PasswordResetPage>;

  beforeEach(async () => {
    api = new 가짜세션API();
    store = new 가짜세션저장소();

    await TestBed.configureTestingModule({
      imports: [PasswordResetPage],
      providers: [
        provideRouter([]),
        { provide: SessionApi, useValue: api },
        { provide: SessionStore, useValue: store },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordResetPage);
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

  async function 코드입력(code: string): Promise<void> {
    입력('ui-otp-input input', code);
    await 제출();
  }

  async function 새비밀번호(password: string, confirm = password): Promise<void> {
    const 칸 = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    칸[0].value = password;
    칸[0].dispatchEvent(new Event('input'));
    칸[1].value = confirm;
    칸[1].dispatchEvent(new Event('input'));
    await 제출();
  }

  it('AUTH-07 이메일 → 코드 → 새 비밀번호로 재설정된다', async () => {
    await 코드받기();
    await 코드입력('123456');
    await 새비밀번호('new-password-1234');

    expect(api.발급인자).toEqual(['someone@example.com']);
    expect(api.확인인자).toEqual([['v-1', '123456', 'new-password-1234']]);
  });

  it('AUTH-07 재설정 성공을 전 세션 무효화와 함께 알린다', async () => {
    await 코드받기();
    await 코드입력('123456');
    await 새비밀번호('new-password-1234');

    // 조용히 넘어가면 사용자는 다음 화면에서 영문 모를 401을 만난다
    expect(본문()).toContain('모든 기기에서 로그아웃되었습니다');
    // 로컬 상태를 맞추지 않으면 화면만 로그인 상태로 남는다
    expect(store.만료처리횟수).toBe(1);
  });

  it('AUTH-07 계정이 없는 이메일도 같은 화면으로 넘어간다', async () => {
    // 서버는 계정이 없어도 식별자를 주고 아무도 맞힐 수 없는 대기 레코드를 남긴다.
    // 화면이 "가입되지 않은 이메일입니다"를 만들어내면 그 설계가 무너진다.
    await 코드받기();

    expect(요소('ui-otp-input')).toBeTruthy();
    expect(본문()).not.toContain('가입되지 않은');
  });

  it('AUTH-07 코드가 틀리면 비밀번호가 아니라 코드 입력으로 되돌린다', async () => {
    api.확인실패 = new ApiError(
      'validation',
      '확인 코드가 올바르지 않습니다.',
      400,
      'AUTH_OTP_INVALID',
    );

    await 코드받기();
    await 코드입력('111111');
    await 새비밀번호('new-password-1234');

    expect(요소('ui-otp-input')).toBeTruthy();
    expect(본문()).toContain('확인 코드가 올바르지 않습니다.');
  });

  it('비밀번호가 서로 다르면 서버를 부르지 않는다', async () => {
    await 코드받기();
    await 코드입력('123456');
    await 새비밀번호('new-password-1234', 'other-password-9999');

    expect(api.확인인자).toEqual([]);
    expect(본문()).toContain('비밀번호가 일치하지 않습니다.');
  });
});
