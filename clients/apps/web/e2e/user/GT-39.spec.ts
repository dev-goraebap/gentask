import { type Page } from '@playwright/test';
import { expect, test, 받은_코드 } from '../fixtures';
import { 등록한다, 로그인_전, 로그인한다, 새_이메일, 비밀번호 } from './account-support';

// GT-39 비밀번호 재설정하기

test.use(로그인_전);

const 새_비밀번호 = 'reset-me-9!';

/** 계정을 만들고 그 주소로 재설정 코드까지 받는다. */
async function 재설정을_시작한다(page: Page): Promise<string> {
  const email = 새_이메일();
  await 등록한다(page, email);
  await expect(page).toHaveURL(/\/todo\//);

  await page.goto('/password-reset');
  await page.locator('#reset-email').fill(email);
  await page.locator('#reset-request').click();
  await expect(page.locator('#reset-code')).toBeVisible();
  return email;
}

test.describe('GT-39 비밀번호 재설정하기', () => {
  test('GT-39 #2: 코드와 새 비밀번호를 제출하면 새 비밀번호로 로그인하게 한다', async ({
    page,
  }) => {
    const email = await 재설정을_시작한다(page);

    await page.locator('#reset-code').fill(await 받은_코드(page.request, email));
    await page.locator('#reset-new-password').fill(새_비밀번호);
    await page.locator('#reset-confirm').click();

    // 앞서 열린 자리를 모두 거두었으므로 로그인 자리로 온다
    await expect(page).toHaveURL(/\/login/);

    await 로그인한다(page, email, 새_비밀번호);
    await expect(page).toHaveURL(/\/todo\//);
  });

  test('GT-39 #5: 새 비밀번호가 규칙에 맞지 않으면 충족하지 못한 조건을 알린다', async ({
    page,
  }) => {
    const email = await 재설정을_시작한다(page);

    await page.locator('#reset-code').fill(await 받은_코드(page.request, email));
    await page.locator('#reset-new-password').fill('onlyletters');
    await page.locator('#reset-confirm').click();

    // 규칙 안내문에도 같은 낱말이 있어 오류 자리로 좁힌다
    await expect(
      page.locator('hlm-field-error').filter({ hasText: '숫자 · 특수문자' }),
    ).toBeVisible();
    // 규칙에 걸렸으므로 코드는 그대로 남고 자리에 머문다
    await expect(page.locator('#reset-code')).toBeVisible();
  });

  test('GT-39 #6: 제출한 코드가 맞지 않으면 코드가 맞지 않음을 알린다', async ({ page }) => {
    const email = await 재설정을_시작한다(page);

    await page.locator('#reset-code').fill('000000');
    await page.locator('#reset-new-password').fill(새_비밀번호);
    await page.locator('#reset-confirm').click();

    await expect(page.getByRole('alert')).toContainText('코드');
    // 바뀌지 않았으므로 옛 비밀번호로 그대로 들어간다
    await 로그인한다(page, email, 비밀번호);
    await expect(page).toHaveURL(/\/todo\//);
  });
});
