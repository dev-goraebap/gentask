import { type Page } from '@playwright/test';
import { expect, test, 받은_코드 } from '../fixtures';
import { 등록한다, 로그인_전, 로그인한다, 새_이메일, 비밀번호 } from './account-support';

// 비밀번호 재설정하기

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

test.describe('비밀번호 재설정하기', () => {
  test('코드와 새 비밀번호를 제출하면 새 비밀번호로 로그인하게 한다', async ({
    page,
  }) => {
    const email = await 재설정을_시작한다(page);

    await page.locator('#reset-code').fill(await 받은_코드(page.request, email));
    await page.locator('#reset-new-password').fill(새_비밀번호);
    await page.locator('#reset-confirm').click();

    // 기존 세션이 만료되었으므로 로그인 화면으로 리다이렉트된다
    await expect(page).toHaveURL(/\/login/);

    await 로그인한다(page, email, 새_비밀번호);
    await expect(page).toHaveURL(/\/todo\//);
  });

  test('새 비밀번호가 규칙에 맞지 않으면 충족하지 못한 조건을 알린다', async ({
    page,
  }) => {
    const email = await 재설정을_시작한다(page);

    await page.locator('#reset-code').fill(await 받은_코드(page.request, email));
    await page.locator('#reset-new-password').fill('onlyletters');
    await page.locator('#reset-confirm').click();

    // 오류 메시지 영역을 명시적으로 탐색한다
    await expect(
      page.locator('hlm-field-error').filter({ hasText: '숫자 · 특수문자' }),
    ).toBeVisible();
    // 유효성 검증 실패 시 인증 코드가 유지되고 현재 단계에 머무른다
    await expect(page.locator('#reset-code')).toBeVisible();
  });

  test('제출한 코드가 맞지 않으면 코드가 맞지 않음을 알린다', async ({ page }) => {
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
