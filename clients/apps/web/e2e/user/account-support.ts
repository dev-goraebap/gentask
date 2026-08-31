import { randomUUID } from 'node:crypto';
import { type Page, expect } from '@playwright/test';
import { 받은_코드 } from '../fixtures';

// 로그인 이전을 지나는 Story 셋(TG-003.01 · TG-003.05 · TG-003.06)이 함께 쓴다.

/** 워커의 세션을 쓰지 않는다. 이 Story 들은 로그인 화면을 직접 지나야 한다. */
export const 로그인_전 = { storageState: { cookies: [], origins: [] } };

export const 비밀번호 = 'e2e-password-1234';

export function 새_이메일(): string {
  return `e2e-acc-${randomUUID()}@example.com`;
}

/** 자격을 적고 코드를 받는 데까지다. 계정은 아직 생기지 않는다. */
export async function 코드를_받는다(page: Page, email: string): Promise<void> {
  await page.goto('/signup');
  await page.locator('#signup-email').fill(email);
  await page.locator('#signup-password').fill(비밀번호);
  await page.getByRole('button', { name: '코드 받기' }).click();
}

/** 코드까지 넣어 계정을 만든다. */
export async function 등록한다(page: Page, email: string): Promise<void> {
  await 코드를_받는다(page, email);
  await expect(page.locator('#signup-code')).toBeVisible();
  await page.locator('#signup-code').fill(await 받은_코드(page.request, email));
  await page.locator('#signup-confirm').click();
}

/** 등록이 끝나 세션이 붙을 때까지 기다린다. 기다리지 않고 이동하면 요청이 끊긴다. */
export async function 등록하고_들어간다(page: Page, email: string): Promise<void> {
  await 등록한다(page, email);
  await expect(page).toHaveURL(/\/tasks\//);
}

export async function 로그아웃한다(page: Page): Promise<void> {
  await page.goto('/account');
  await page.getByRole('button', { name: '로그아웃' }).click();
}

export async function 로그인한다(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
}
