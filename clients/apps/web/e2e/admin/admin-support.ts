import { type Page } from '@playwright/test';
import { 관리자_이메일 } from '../env';
import { API로_가입한다 } from '../fixtures';

// 첫 관리자는 서버 설정이 정하므로 그 계정 하나뿐이다. 워커마다 새로 만들 수 없어 모든 관리자 시험이
// 같은 계정을 나눠 쓰며, 먼저 온 쪽이 가입하고 뒤에 온 쪽이 로그인한다.

const 비밀번호 = 'e2e-password-1234';

/** 브라우저 문맥의 세션을 관리자로 바꾼다. */
export async function 관리자로_들어간다(page: Page): Promise<void> {
  for (let 시도 = 0; 시도 < 5; 시도 += 1) {
    const 시작 = await page.request.post('/api/v1/auth/signup', {
      data: { email: 관리자_이메일, password: 비밀번호, nickname: '관리자' },
    });
    if (시작.status() === 202) {
      const 코드 = await page.request.get(`/e2e/last-code?email=${encodeURIComponent(관리자_이메일)}`);
      const 마침 = await page.request.post('/api/v1/auth/signup/confirm', {
        data: { email: 관리자_이메일, code: ((await 코드.json()) as { code: string }).code },
      });
      if (마침.status() === 201) return;
    }

    const 로그인 = await page.request.post('/api/v1/auth/login', {
      data: { email: 관리자_이메일, password: 비밀번호 },
    });
    // 로그인은 본문 없이 쿠키만 내려 204 로 답한다
    if (로그인.status() === 204) return;
  }
  throw new Error('관리자 세션을 얻지 못했습니다');
}

/** 관리자가 찾을 수 있도록 일반 사용자 하나를 만든다. */
export async function 일반_사용자를_만든다(page: Page, 표식: string): Promise<string> {
  const email = `e2e-managed-${표식}@example.com`;
  await API로_가입한다(page.request, { email, password: 비밀번호, nickname: `관리대상${표식}` });
  return email;
}
