import { 작업을_만든다, expect, test } from '../fixtures';

// 작업 제목 편집

test.describe('작업 제목 편집', () => {
  async function 상세를_연다(page: import('@playwright/test').Page, 제목: string): Promise<void> {
    await page.goto('/todo/all');
    await page.getByRole('link', { name: 제목 }).click();
    await expect(page.locator('#task-title')).toHaveValue(제목);
  }

  test('제목을 편집하고 벗어나면 편집한 제목을 반영한다', async ({ page, request }) => {
    await 작업을_만든다(request, '고칠 제목');
    await 상세를_연다(page, '고칠 제목');

    await page.locator('#task-title').fill('고쳐진 제목');
    await page.locator('#task-title').blur();

    await page.goto('/todo/all');
    await expect(page.getByRole('link', { name: '고쳐진 제목' })).toBeVisible();
  });

  test('편집한 제목이 비어 있으면 반영하지 않는다', async ({ page, request }) => {
    await 작업을_만든다(request, '비우지 못할 제목');
    await 상세를_연다(page, '비우지 못할 제목');

    await page.locator('#task-title').fill('   ');
    await page.locator('#task-title').blur();

    await page.goto('/todo/all');
    await expect(page.getByRole('link', { name: '비우지 못할 제목' })).toBeVisible();
  });

  test('편집한 제목이 비어 있으면 사유를 보여 준다', async ({ page, request }) => {
    await 작업을_만든다(request, '사유를 볼 제목');
    await 상세를_연다(page, '사유를 볼 제목');

    await page.locator('#task-title').fill('   ');
    await page.locator('#task-title').blur();

    await expect(page.getByText('제목을 입력해 주세요')).toBeVisible();
  });

  test('편집하다 그만두면 편집하던 제목을 반영하지 않는다', async ({
    page,
    request,
  }) => {
    await 작업을_만든다(request, '그만둘 제목');
    await 상세를_연다(page, '그만둘 제목');

    await page.locator('#task-title').fill('반영되면 안 되는 제목');
    await page.locator('#task-title').press('Escape');

    await page.goto('/todo/all');
    await expect(page.getByRole('link', { name: '그만둘 제목' })).toBeVisible();
    await expect(page.getByRole('link', { name: '반영되면 안 되는 제목' })).toHaveCount(0);
  });
});
