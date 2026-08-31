import { expect, test } from '../fixtures';
import { 로그인_전 } from '../user/account-support';

// 실패한 자리. 인수 조건을 갖지 않으므로 추적 키를 붙이지 않는다.
// 로그인하지 않아도 보여야 하므로 세션 없이 지난다.

test.use(로그인_전);

test.describe('실패한 자리', () => {
  test('없는 주소는 404 자리로 간다', async ({ page }) => {
    await page.goto('/이런-자리는-없다');

    await expect(page).toHaveURL(/\/404/);
    await expect(page.getByText('찾는 자리가 없습니다')).toBeVisible();
    await expect(page.getByRole('link', { name: '처음으로' })).toBeVisible();
  });

  test('500 자리는 서버에 닿지 못했음을 알린다', async ({ page }) => {
    await page.goto('/500');

    await expect(page.getByText('서버에 닿지 못했습니다')).toBeVisible();
  });
});
