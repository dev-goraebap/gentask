import { expect, test } from '../fixtures';
import {
  등록하고_들어간다,
  등록한다,
  로그인_전,
  비밀번호,
  새_이메일,
  코드를_받는다,
} from './account-support';

// TG-026 계정 만들기

test.use(로그인_전);

test.describe('TG-026 계정 만들기', () => {
  test('TG-026 #1: 이메일과 비밀번호로 등록하면 계정을 만든다', async ({ page }) => {
    const email = 새_이메일();

    // 세션이 붙을 때까지 기다린다. 누르자마자 물으면 등록 요청이 아직 가는 중일 수 있다.
    await 등록하고_들어간다(page, email);

    // 계정이 만들어졌으면 같은 이메일로는 가입을 시작할 수도 없다.
    const 응답 = await page.request.post('/api/v1/auth/signup', {
      data: { email, password: 비밀번호, nickname: '중복' },
    });
    expect(응답.status()).toBe(409);
  });

  test('TG-026 #7: 등록이 끝나면 곧바로 로그인 상태로 작업 목록을 보여 준다', async ({ page }) => {
    await 등록한다(page, 새_이메일());

    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.getByPlaceholder('작업 추가')).toBeVisible();
  });

  test('TG-026 #2: 이미 등록된 이메일로 등록하려 하면 이미 등록된 이메일임을 알린다', async ({
    page,
  }) => {
    const email = 새_이메일();
    await 등록하고_들어간다(page, email);

    // 첫 단계에서 걸린다. 코드를 보내기 전에 그 주소가 쓰이고 있음이 드러난다.
    await 코드를_받는다(page, email);

    await expect(page.getByRole('alert')).toBeVisible();
  });
});
