import { 작업을_만든다, expect, test } from '../fixtures';

// ST-009 작업 삭제

test.describe('ST-009 작업 삭제', () => {
  async function 상세를_연다(page: import('@playwright/test').Page, 제목: string): Promise<void> {
    await page.goto('/tasks/all');
    await page.getByRole('link', { name: 제목 }).click();
    await expect(page.getByRole('button', { name: '작업 삭제' })).toBeVisible();
  }

  test('ST-009 AC1: 삭제하겠다고 하면 되돌릴 수 없음을 확인받는다', async ({ page, request }) => {
    await 작업을_만든다(request, '삭제 확인을 볼 작업');
    await 상세를_연다(page, '삭제 확인을 볼 작업');

    await page.getByRole('button', { name: '작업 삭제' }).click();

    await expect(page.getByText('지운 뒤에는 되돌릴 수 없습니다.')).toBeVisible();
  });

  test('ST-009 AC2: 확인하지 않으면 작업을 그대로 둔다', async ({ page, request }) => {
    await 작업을_만든다(request, '취소할 작업');
    await 상세를_연다(page, '취소할 작업');

    await page.getByRole('button', { name: '작업 삭제' }).click();
    await page.getByRole('button', { name: '취소' }).click();

    await page.goto('/tasks/all');
    await expect(page.getByRole('link', { name: '취소할 작업' })).toBeVisible();
  });

  test('ST-009 AC3: 확인하면 작업을 목록에서 뺀다', async ({ page, request }) => {
    await 작업을_만든다(request, '지울 작업');
    await 상세를_연다(page, '지울 작업');

    await page.getByRole('button', { name: '작업 삭제' }).click();
    await page.getByRole('button', { name: '삭제', exact: true }).click();

    await page.goto('/tasks/all');
    await expect(page.getByRole('link', { name: '지울 작업' })).toHaveCount(0);
  });
});
