import { expect, test } from '../fixtures';
import { 등록한다, 로그인_전, 새_이메일, 코드를_받는다, 비밀번호 } from './account-support';

// TG-038 이메일을 확인하고 가입하기

test.use(로그인_전);

test.describe('TG-038 이메일을 확인하고 가입하기', () => {
  test('TG-038 #2: 받은 코드를 제출하면 계정을 만들고 작업 목록을 보여 준다', async ({
    page,
  }) => {
    await 등록한다(page, 새_이메일());

    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.getByPlaceholder('작업 추가')).toBeVisible();
  });

  test('TG-038 #4: 비밀번호가 규칙에 맞지 않으면 충족하지 못한 조건을 알린다', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.locator('#signup-email').fill(새_이메일());
    // 영문자만 있고 숫자와 특수문자가 없다
    await page.locator('#signup-password').fill('onlyletters');
    await page.getByRole('button', { name: '코드 받기' }).click();

    // 규칙 안내문에도 같은 낱말이 있어 오류 자리로 좁힌다
    await expect(
      page.locator('hlm-field-error').filter({ hasText: '숫자 · 특수문자' }),
    ).toBeVisible();
    // 규칙에 걸렸으므로 코드를 받는 자리로 넘어가지 않는다
    await expect(page.locator('#signup-code')).toBeHidden();
  });

  test('TG-038 #5: 제출한 코드가 맞지 않으면 코드가 맞지 않음을 알린다', async ({ page }) => {
    await 코드를_받는다(page, 새_이메일());
    await expect(page.locator('#signup-code')).toBeVisible();

    await page.locator('#signup-code').fill('000000');
    await page.locator('#signup-confirm').click();

    await expect(page.getByRole('alert')).toContainText('코드');
    // 계정이 생기지 않았으므로 자리에 그대로 머문다
    await expect(page).toHaveURL(/\/signup/);
  });

  test('자격을 고치러 돌아가도 적어 둔 것이 남는다', async ({ page }) => {
    const email = 새_이메일();
    await 코드를_받는다(page, email);
    await expect(page.locator('#signup-code')).toBeVisible();

    await page.getByRole('button', { name: '주소 고치기' }).click();

    await expect(page.locator('#signup-email')).toHaveValue(email);
    await expect(page.locator('#signup-password')).toHaveValue(비밀번호);
  });
});
