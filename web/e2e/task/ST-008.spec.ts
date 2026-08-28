import { 빈_계정으로_바꾼다, 작업을_만든다, expect, test } from '../fixtures';

// ST-008 작업 속성 편집
// 상세 패널의 조작 요소는 목록에도 같은 이름이 있으므로 buttonId 로 집는다.

test.describe('ST-008 작업 속성 편집', () => {
  async function 상세를_연다(page: import('@playwright/test').Page, 제목: string): Promise<void> {
    await 빈_계정으로_바꾼다(page);
    await 작업을_만든다(page.request, 제목);
    await page.goto('/tasks/all');
    await page.getByRole('link', { name: 제목 }).click();
    await expect(page.locator('#task-title')).toHaveValue(제목);
  }

  test('ST-008 AC1: 메모를 편집하고 벗어나면 편집한 메모를 반영한다', async ({ page }) => {
    await 상세를_연다(page, '메모를 붙일 작업');

    await page.locator('#task-note').fill('우유와 달걀');
    await page.locator('#task-note').blur();

    await page.reload();
    await expect(page.locator('#task-note')).toHaveValue('우유와 달걀');
  });

  test('ST-008 AC2: 기한을 고르면 즉시 반영한다', async ({ page }) => {
    await 상세를_연다(page, '기한을 붙일 작업');

    await page.locator('#task-due').click();
    await page.getByRole('button', { name: '오늘', exact: false }).first().click();

    await page.goto('/tasks/planned');
    await expect(page.getByRole('link', { name: '기한을 붙일 작업' })).toBeVisible();
  });

  test('ST-008 AC3: 미리 알림을 고르면 즉시 반영한다', async ({ page }) => {
    await 상세를_연다(page, '알림을 붙일 작업');

    await page.locator('#task-remind').click();
    await page.getByRole('button', { name: '내일', exact: false }).first().click();

    await page.goto('/tasks/all');
    const 행 = page.getByRole('listitem').filter({ hasText: '알림을 붙일 작업' });
    await expect(행).toContainText('내일');
  });

  test('ST-008 AC4: 중요 표시를 바꾸면 즉시 반영한다', async ({ page }) => {
    await 상세를_연다(page, '중요로 표시할 작업');

    await page.getByRole('button', { name: '중요로 표시', exact: true }).click();

    await page.goto('/tasks/important');
    await expect(page.getByRole('link', { name: '중요로 표시할 작업' })).toBeVisible();
  });

  test('ST-008 AC5: 나의 하루에 추가하면 즉시 반영한다', async ({ page }) => {
    await 상세를_연다(page, '나의 하루에 담을 작업');

    await page.getByRole('button', { name: '나의 하루에 추가', exact: true }).click();

    await page.goto('/tasks/my-day');
    await expect(page.getByRole('link', { name: '나의 하루에 담을 작업' })).toBeVisible();
  });
});
