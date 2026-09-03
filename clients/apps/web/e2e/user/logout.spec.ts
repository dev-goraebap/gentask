import { expect, test } from '../fixtures';
import { 등록하고_들어간다, 로그아웃한다, 로그인_전, 새_이메일 } from './account-support';

// 로그아웃하기

test.use(로그인_전);

test.describe('로그아웃하기', () => {
  test('로그아웃 후 보호된 경로에 접근하면 로그인 화면으로 리다이렉트된다', async ({ page }) => {
    await 등록하고_들어간다(page, 새_이메일());

    await 로그아웃한다(page);

    await page.goto('/todo/all');
    await expect(page).toHaveURL(/\/login/);
  });
});
