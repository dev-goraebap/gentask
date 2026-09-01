import { expect, test } from '../fixtures';

// TG-022 작업 편집 실패

const 없는_작업 = '00000000-0000-0000-0000-000000000000';

test.describe('TG-022 작업 편집 실패', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/tasks/all?task=${없는_작업}`);
  });

  test('TG-022 #1: 편집하려는 작업이 없으면 찾을 수 없음을 알린다', async ({ page }) => {
    await expect(page.getByText('찾을 수 없는 작업입니다.')).toBeVisible();
  });

  test('TG-022 #2: 편집하려는 작업이 없으면 목록으로 돌아가는 수단을 보여 준다', async ({
    page,
  }) => {
    const 닫기 = page.getByRole('button', { name: '닫기' });
    await expect(닫기).toBeVisible();

    await 닫기.click();

    await expect(page).toHaveURL(/\/tasks\/all$/);
  });
});
