import { 빈_계정으로_바꾼다, expect, test } from '../fixtures';

// 프로필 보기와 계정 자리
//
// AC4 · AC5 · AC9 는 결번이다. 화면 폭에 따른 배치 분기였고 결정-0008 이 그것을
// 인수 조건에서 뺐다. 좁은 화면의 하단 탭과 드로어는 작업자가 화면 조작으로 확인한다.

/** 별명을 고치고 반영을 기다린다. Enter 로 확정한다. */
async function 별명을_고친다(page: import('@playwright/test').Page, 별명: string): Promise<void> {
  const 입력 = page.locator('#account-nickname');
  await 입력.fill(별명);
  await 입력.press('Enter');
}

test.describe('프로필 보기와 계정 자리', () => {
  test('계정 화면은 프로필 자리에 아바타를 둔다', async ({ page }) => {
    await page.goto('/me');

    await expect(page.getByRole('main').locator('app-user-avatar')).toBeVisible();
  });

  test('올린 이미지가 없으면 아바타 자리에 별명의 첫 글자가 온다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);

    await page.goto('/me');

    const 아바타 = page.getByRole('main').locator('app-user-avatar');
    await expect(아바타).toHaveText('빈');
    await expect(아바타.locator('img')).toHaveCount(0);
  });

  test('계정 화면은 이메일과 별명과 가입일을 함께 보여 준다', async ({ page, 계정 }) => {
    const 응답 = await page.request.get('/api/v1/me');
    const { createdAt } = (await 응답.json()) as { createdAt: string };
    const 가입일 = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' }).format(
      new Date(createdAt),
    );

    await page.goto('/me');

    const 프로필 = page.getByRole('main');
    await expect(프로필.getByText(계정.email)).toBeVisible();
    await expect(프로필.getByText(계정.nickname, { exact: true })).toBeVisible();
    await expect(프로필.getByText(`${가입일} 가입`)).toBeVisible();
  });

  test('별명을 고치면 프로필의 이름 표시가 바뀐다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await page.goto('/me');

    await 별명을_고친다(page, '고친별명');

    await expect(page.getByRole('main').getByText('고친별명', { exact: true })).toBeVisible();
  });

  test('별명을 고치면 사이드바의 이름 표시도 바뀐다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await page.goto('/me');
    await expect(page.locator('#sidebar').getByText('빈계정')).toBeVisible();

    await 별명을_고친다(page, '사이드바별명');

    await expect(page.locator('#sidebar').getByText('사이드바별명')).toBeVisible();
  });

  test('사이드바의 내 프로필을 고르면 계정 화면으로 간다', async ({ page, 계정 }) => {
    await page.goto('/todo/all');

    await page.locator('#sidebar').getByRole('link', { name: 계정.nickname }).click();

    await expect(page).toHaveURL(/\/me/);
    await expect(page.getByRole('heading', { name: '계정' })).toBeVisible();
  });
});
