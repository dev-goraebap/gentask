import { 빈_계정으로_바꾼다, expect, test } from '../fixtures';

// ST-013 미리 알림 있는 작업 추가

test.describe('ST-013 미리 알림 있는 작업 추가', () => {
  test.beforeEach(async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await page.goto('/tasks/all');
  });

  async function 미리_알림을_고른다(page: import('@playwright/test').Page): Promise<void> {
    await page.getByRole('button', { name: '미리 알림 설정' }).click();
    await page.getByRole('button', { name: '내일', exact: false }).first().click();
  }

  test('ST-013 AC1: 알릴 시각을 고르고 확정하면 미리 알림이 붙은 작업을 목록에 넣는다', async ({
    page,
  }) => {
    await 미리_알림을_고른다(page);

    const 입력 = page.getByPlaceholder('작업 추가');
    await 입력.fill('알림이 붙은 작업');
    await 입력.press('Enter');

    await expect(page.getByRole('link', { name: '알림이 붙은 작업' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: '알림이 붙은 작업' })).toBeVisible();
  });

  test('ST-013 AC2: 목록에서 그 작업의 미리 알림을 보여 준다', async ({ page }) => {
    await 미리_알림을_고른다(page);

    const 입력 = page.getByPlaceholder('작업 추가');
    await 입력.fill('알림을 보여 줄 작업');
    await 입력.press('Enter');

    const 행 = page.getByRole('listitem').filter({ hasText: '알림을 보여 줄 작업' });
    await expect(행).toContainText('내일');
  });

  test('ST-013 AC3: 기한을 정하지 않았어도 미리 알림만 붙인 작업을 받는다', async ({ page }) => {
    await 미리_알림을_고른다(page);

    const 입력 = page.getByPlaceholder('작업 추가');
    await 입력.fill('기한 없이 알림만 붙인 작업');
    await 입력.press('Enter');
    await expect(page.getByRole('link', { name: '기한 없이 알림만 붙인 작업' })).toBeVisible();

    // 기한이 붙지 않았으므로 계획된 일정 목록에는 나타나지 않는다.
    await page.goto('/tasks/planned');
    await expect(page.getByRole('link', { name: '기한 없이 알림만 붙인 작업' })).toHaveCount(0);
  });
});
