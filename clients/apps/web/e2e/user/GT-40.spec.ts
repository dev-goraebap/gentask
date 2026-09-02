import { type Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { 등록한다, 로그인_전, 로그인한다, 새_이메일, 비밀번호 } from './account-support';

// GT-40 비밀번호 바꾸기

// 워커의 세션을 쓰지 않는다. 비밀번호를 갈면 그 워커의 다른 시험이 함께 흔들린다.
test.use(로그인_전);

const 새_비밀번호 = 'change-me-9!';

/** 계정을 만들고 그 자리에서 비밀번호 자리를 연다. */
async function 계정_자리로_간다(page: Page): Promise<string> {
  const email = 새_이메일();
  await 등록한다(page, email);
  await expect(page).toHaveURL(/\/todo\//);

  await page.goto('/me');
  await expect(page.locator('#account-current-password')).toBeVisible();
  return email;
}

test.describe('GT-40 비밀번호 바꾸기', () => {
  test('GT-40 #1: 현재 비밀번호와 새 비밀번호를 제출하면 비밀번호를 바꾼다', async ({
    page,
  }) => {
    const email = await 계정_자리로_간다(page);

    await page.locator('#account-current-password').fill(비밀번호);
    await page.locator('#account-new-password').fill(새_비밀번호);
    await page.locator('#account-change-password').click();
    await expect(page.getByText('비밀번호를 바꿨습니다.', { exact: false })).toBeVisible();

    // 바뀌었으면 옛 비밀번호로는 들어가지 못하고 새 것으로는 들어간다
    await page.goto('/me');
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/login/);

    await 로그인한다(page, email, 비밀번호);
    await expect(page.getByRole('alert')).toBeVisible();

    await 로그인한다(page, email, 새_비밀번호);
    await expect(page).toHaveURL(/\/todo\//);
  });

  test('GT-40 #2: 바꾸어도 지금 쓰는 자리의 로그인은 유지된다', async ({ page }) => {
    await 계정_자리로_간다(page);

    await page.locator('#account-current-password').fill(비밀번호);
    await page.locator('#account-new-password').fill(새_비밀번호);
    await page.locator('#account-change-password').click();
    await expect(page.getByText('비밀번호를 바꿨습니다.', { exact: false })).toBeVisible();

    // 이 자리는 그대로다. 로그인 자리로 밀려나지 않는다.
    await page.goto('/todo/all');
    await expect(page.getByPlaceholder('작업 추가')).toBeVisible();
  });

  test('GT-40 #4: 현재 비밀번호가 맞지 않으면 아무것도 바꾸지 않는다', async ({ page }) => {
    const email = await 계정_자리로_간다(page);

    await page.locator('#account-current-password').fill('totally-wrong-1!');
    await page.locator('#account-new-password').fill(새_비밀번호);
    await page.locator('#account-change-password').click();
    await expect(page.getByText('현재 비밀번호가 맞지 않습니다', { exact: false })).toBeVisible();

    // 바뀌지 않았으므로 옛 비밀번호로 그대로 들어간다
    await page.goto('/me');
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/login/);
    await 로그인한다(page, email, 비밀번호);
    await expect(page).toHaveURL(/\/todo\//);
  });

  test('GT-40 #5: 새 비밀번호가 규칙에 맞지 않으면 충족하지 못한 조건을 알린다', async ({
    page,
  }) => {
    await 계정_자리로_간다(page);

    await page.locator('#account-current-password').fill(비밀번호);
    await page.locator('#account-new-password').fill('onlyletters');
    await page.locator('#account-change-password').click();

    // 규칙 안내문에도 같은 낱말이 있어 오류 자리로 좁힌다
    await expect(
      page.locator('hlm-field-error').filter({ hasText: '숫자 · 특수문자' }),
    ).toBeVisible();
  });

  test('GT-40 #6: 새 비밀번호가 지금 것과 같으면 달라야 함을 알린다', async ({ page }) => {
    await 계정_자리로_간다(page);

    await page.locator('#account-current-password').fill(비밀번호);
    await page.locator('#account-new-password').fill(비밀번호);
    await page.locator('#account-change-password').click();

    await expect(page.getByText('다른 것으로 정해 주세요', { exact: false })).toBeVisible();
  });
});
