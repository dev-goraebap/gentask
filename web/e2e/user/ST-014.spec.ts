import { expect, test } from '../fixtures';

// ST-014 계정으로 시작하기
// 이 Story 는 로그인 이전을 다루므로 워커의 세션을 쓰지 않는다.

test.use({ storageState: { cookies: [], origins: [] } });

function 새_이메일(): string {
  return `e2e-acc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

const 비밀번호 = 'e2e-password-1234';

test.describe('ST-014 계정으로 시작하기', () => {
  async function 등록한다(
    page: import('@playwright/test').Page,
    email: string,
  ): Promise<void> {
    await page.goto('/signup');
    await page.locator('#signup-email').fill(email);
    await page.locator('#signup-password').fill(비밀번호);
    await page.getByRole('button', { name: '등록' }).click();
  }

  /** 등록이 끝나 세션이 붙을 때까지 기다린다. 기다리지 않고 이동하면 요청이 끊긴다. */
  async function 등록하고_들어간다(
    page: import('@playwright/test').Page,
    email: string,
  ): Promise<void> {
    await 등록한다(page, email);
    await expect(page).toHaveURL(/\/tasks\//);
  }

  test('ST-014 AC1: 이메일과 비밀번호로 등록하면 계정을 만든다', async ({ page }) => {
    const email = 새_이메일();

    await 등록한다(page, email);

    // 계정이 만들어졌으면 같은 이메일로 다시 등록할 수 없다.
    const 응답 = await page.request.post('/api/v1/auth/signup', {
      data: { email, password: 비밀번호, nickname: '중복' },
    });
    expect(응답.status()).toBe(409);
  });

  test('ST-014 AC7: 등록이 끝나면 곧바로 로그인 상태로 작업 목록을 보여 준다', async ({ page }) => {
    await 등록한다(page, 새_이메일());

    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.getByPlaceholder('작업 추가')).toBeVisible();
  });

  test('ST-014 AC2: 이미 등록된 이메일로 등록하려 하면 이미 등록된 이메일임을 알린다', async ({
    page,
  }) => {
    const email = 새_이메일();
    await 등록하고_들어간다(page, email);

    await 등록한다(page, email);

    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('ST-014 AC3: 맞는 자격으로 로그인하면 그 계정의 작업 목록을 보여 준다', async ({ page }) => {
    const email = 새_이메일();
    await 등록하고_들어간다(page, email);
    await page.goto('/account');
    await page.getByRole('button', { name: '로그아웃' }).click();

    await page.goto('/login');
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(비밀번호);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.getByPlaceholder('작업 추가')).toBeVisible();
  });

  test('ST-014 AC4: 자격이 맞지 않으면 어느 쪽이 틀렸는지 구분하지 않고 알린다', async ({
    page,
  }) => {
    const email = 새_이메일();
    await 등록하고_들어간다(page, email);
    await page.goto('/account');
    await page.getByRole('button', { name: '로그아웃' }).click();

    await page.goto('/login');
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill('틀린-비밀번호-1234');
    await page.getByRole('button', { name: '로그인' }).click();
    const 없는_계정_문구 = await page.getByRole('alert').first().textContent();

    await page.locator('#login-email').fill(새_이메일());
    await page.locator('#login-password').fill(비밀번호);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page.getByRole('alert').first()).toHaveText(없는_계정_문구 ?? '');
  });

  test('ST-014 AC5: 로그아웃하면 이후 작업 화면 접근은 로그인 자리로 안내된다', async ({ page }) => {
    await 등록하고_들어간다(page, 새_이메일());
    await page.goto('/account');

    await page.getByRole('button', { name: '로그아웃' }).click();

    await page.goto('/tasks/all');
    await expect(page).toHaveURL(/\/login/);
  });
});
