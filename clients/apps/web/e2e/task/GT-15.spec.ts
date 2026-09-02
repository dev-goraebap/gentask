import { 빈_계정으로_바꾼다, expect, test } from '../fixtures';

// GT-15 기한 있는 작업 추가

test.describe('GT-15 기한 있는 작업 추가', () => {
  test.beforeEach(async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await page.goto('/todo/all');
  });

  test('GT-15 #1: 기한을 고르고 확정하면 기한이 붙은 작업을 목록에 넣는다', async ({ page }) => {
    await page.getByRole('button', { name: '기한 설정' }).click();
    await page.getByRole('button', { name: '오늘', exact: false }).first().click();

    const 입력 = page.getByPlaceholder('작업 추가');
    await 입력.fill('기한이 붙은 작업');
    await 입력.press('Enter');
    await expect(page.getByRole('link', { name: '기한이 붙은 작업' })).toBeVisible();

    // 기한이 실제로 붙었으면 계획된 일정 목록에 나타난다.
    await page.goto('/todo/planned');
    await expect(page.getByRole('link', { name: '기한이 붙은 작업' })).toBeVisible();
  });

  test('GT-15 #2: 목록에서 그 작업의 기한을 보여 준다', async ({ page }) => {
    await page.getByRole('button', { name: '기한 설정' }).click();
    await page.getByRole('button', { name: '오늘', exact: false }).first().click();

    const 입력 = page.getByPlaceholder('작업 추가');
    await 입력.fill('기한을 보여 줄 작업');
    await 입력.press('Enter');

    const 행 = page.getByRole('listitem').filter({ hasText: '기한을 보여 줄 작업' });
    await expect(행).toContainText('오늘');
  });
});
