import { 작업을_만든다, expect, test } from '../fixtures';

// ST-011 작업 완료

test.describe('ST-011 작업 완료', () => {
  test('ST-011 AC1: 완료하면 완료되지 않은 작업 목록에서 뺀다', async ({ page, request }) => {
    await 작업을_만든다(request, '장 보기');
    await page.goto('/tasks/all');

    await page.getByRole('checkbox', { name: '장 보기' }).click();

    await expect(page.getByRole('link', { name: '장 보기' })).toHaveCount(0);
  });

  test('ST-011 AC3: 완료하면 완료된 작업으로 남긴다', async ({ page, request }) => {
    await 작업을_만든다(request, '전기요금 납부');
    await page.goto('/tasks/all');

    await page.getByRole('checkbox', { name: '전기요금 납부' }).click();
    await page.getByRole('button', { name: /완료 \d+개/ }).click();

    await expect(page.getByRole('link', { name: '전기요금 납부' })).toBeVisible();
  });

  test('ST-011 AC2: 완료를 취소하면 완료되지 않은 작업 목록에 다시 보여 준다', async ({
    page,
    request,
  }) => {
    await 작업을_만든다(request, '건강검진 예약');
    await page.goto('/tasks/all');

    await page.getByRole('checkbox', { name: '건강검진 예약' }).click();
    await page.getByRole('button', { name: /완료 \d+개/ }).click();
    await page.getByRole('checkbox', { name: '건강검진 예약' }).click();

    await page.reload();
    await expect(page.getByRole('link', { name: '건강검진 예약' })).toBeVisible();
  });
});
