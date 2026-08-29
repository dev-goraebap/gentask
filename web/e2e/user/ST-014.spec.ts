import { expect, test } from '../fixtures';
import { 등록하고_들어간다, 등록한다, 로그인_전, 비밀번호, 새_이메일 } from './account-support';

// ST-014 계정 만들기

test.use(로그인_전);

test.describe('ST-014 계정 만들기', () => {
  test('ST-014 AC1: 이메일과 비밀번호로 등록하면 계정을 만든다', async ({ page }) => {
    const email = 새_이메일();

    await 등록한다(page, email);

    // 계정이 만들어졌으면 같은 이메일로 다시 등록할 수 없다.
    const 응답 = await page.request.post('/api/v1/auth/signup', {
      data: { email, password: 비밀번호, nickname: '중복' },
    });
    expect(응답.status()).toBe(409);
  });

  test('ST-014 AC7: 등록이 끝나면 곧바로 로그인 상태로 작업 목록을 보여 준다', async ({ page }) => {
    await 등록한다(page, 새_이메일());

    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.getByPlaceholder('작업 추가')).toBeVisible();
  });

  test('ST-014 AC2: 이미 등록된 이메일로 등록하려 하면 이미 등록된 이메일임을 알린다', async ({
    page,
  }) => {
    const email = 새_이메일();
    await 등록하고_들어간다(page, email);

    await 등록한다(page, email);

    await expect(page.getByRole('alert')).toBeVisible();
  });
});
