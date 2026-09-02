import { expect, test } from '../fixtures';
import { 등록하고_들어간다, 로그아웃한다, 로그인_전, 새_이메일 } from './account-support';

// GT-31 로그아웃하기

test.use(로그인_전);

test.describe('GT-31 로그아웃하기', () => {
  test('GT-31 #1: 로그아웃하면 이후 작업 화면 접근은 로그인 자리로 안내된다', async ({ page }) => {
    await 등록하고_들어간다(page, 새_이메일());

    await 로그아웃한다(page);

    await page.goto('/todo/all');
    await expect(page).toHaveURL(/\/login/);
  });
});
