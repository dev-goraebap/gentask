import { expect, test } from '../fixtures';
import { 등록한다, 로그인_전, 새_이메일, 코드를_받는다, 비밀번호 } from './account-support';

// 이메일을 확인하고 가입하기

test.use(로그인_전);

test.describe('이메일을 확인하고 가입하기', () => {
  test('받은 코드를 제출하면 계정을 만들고 작업 목록을 보여 준다', async ({
    page,
  }) => {
    await 등록한다(page, 새_이메일());

    await expect(page).toHaveURL(/\/todo\//);
    await expect(page.getByPlaceholder('작업 추가')).toBeVisible();
  });

  test('비밀번호가 규칙에 맞지 않으면 충족하지 못한 조건을 알린다', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.locator('#signup-email').fill(새_이메일());
    // 영문자만 있고 숫자와 특수문자가 없다
    await page.locator('#signup-password').fill('onlyletters');
    await page.getByRole('button', { name: '코드 받기' }).click();

    // 오류 메시지 영역을 명시적으로 탐색한다
    await expect(
      page.locator('hlm-field-error').filter({ hasText: '숫자 · 특수문자' }),
    ).toBeVisible();
    // 유효성 검증 실패 시 인증 코드 입력 단계로 진행하지 않는다
    await expect(page.locator('#signup-code')).toBeHidden();
  });

  test('제출한 코드가 맞지 않으면 코드가 맞지 않음을 알린다', async ({ page }) => {
    await 코드를_받는다(page, 새_이메일());
    await expect(page.locator('#signup-code')).toBeVisible();

    await page.locator('#signup-code').fill('000000');
    await page.locator('#signup-confirm').click();

    await expect(page.getByRole('alert')).toContainText('코드');
    // 인증 실패 시 계정이 생성되지 않고 현재 화면에 머무른다
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
