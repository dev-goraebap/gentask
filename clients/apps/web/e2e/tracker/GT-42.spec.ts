import { 빈_계정으로_바꾼다, expect, test } from '../fixtures';
import { 기본_프로젝트, 작업_아이템을_만든다, 프로젝트를_만든다 } from './tracker-support';

// GT-42 프로젝트를 세우고 고른다
//
// #1 · #2 · #7 은 접두어를 이름에서 뽑던 때의 것이라 결번이 되었다. 지금 세우는 흐름은 GT-60 이
// 갖는다 — 이름과 접두어를 함께 받고, 주소가 담는 식별자는 시스템이 만든다.

/** 세우는 덮개를 열고 이름과 접두어를 적는다. */
async function 적는다(
  page: import('@playwright/test').Page,
  이름: string,
  접두어: string,
): Promise<void> {
  await page.goto('/projects');
  await page.getByRole('link', { name: '새 프로젝트' }).click();
  await expect(page.locator('#project-create-name')).toBeVisible();
  await page.locator('#project-create-name').fill(이름);
  await page.locator('#project-create-key').fill(접두어);
}

test.describe('GT-42 프로젝트를 세우고 고른다', () => {
  test('GT-60 #1: 이름과 접두어를 적어 세우면 사람이 정하지 않은 식별자로 닿게 한다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);

    await 적는다(page, 'Gentask Web', 'GW');
    await page.getByRole('button', { name: '세우기' }).click();

    // 세운 자리로 곧장 들어간다. 주소가 담는 것은 접두어가 아니라 시스템이 만든 식별자다.
    await expect(page).toHaveURL(/^http:\/\/localhost:4200\/projects\/[\w-]{12}\/issues$/);

    await page.goto('/projects');
    await expect(page.getByText('GW · 작업 아이템 0 · 문서 0')).toBeVisible();
  });

  test('GT-60 #2: 접두어가 비어 있거나 모양에 맞지 않으면 알린다', async ({ page }) => {
    await 적는다(page, '접두어를 잘못 적은 것', '한글');
    await page.locator('#project-create-key').blur();

    await expect(page.getByText('접두어는 영문과 숫자만 쓸 수 있습니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: '세우기' })).toBeDisabled();
  });

  /*
   * 접두어는 이슈 이름에만 쓰이고 해석은 주소의 식별자가 한다. 겹치지 않는 것을 뽑아 주던 자리를
   * 걷었으므로, 같은 접두어를 두 번 적어도 그대로 선다.
   */
  test('GT-60 #3: 접두어가 겹쳐도 그대로 세운다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);

    await 적는다(page, '첫째', 'DUP');
    await page.getByRole('button', { name: '세우기' }).click();
    // 옮겨 간 뒤에 잡는다. 누른 직후에는 아직 덮개의 주소가 남아 있다.
    await expect(page).toHaveURL(/\/issues$/);
    const 첫째 = page.url();

    await 적는다(page, '둘째', 'DUP');
    await page.getByRole('button', { name: '세우기' }).click();
    await expect(page).toHaveURL(/\/issues$/);

    expect(page.url()).not.toBe(첫째);
    await page.goto('/projects');
    await expect(page.getByText('DUP · 작업 아이템 0 · 문서 0')).toHaveCount(2);
  });

  test('GT-42 #4: 이름이 비어 있으면 이름이 필요함을 알린다', async ({ page }) => {
    await 적는다(page, '   ', 'GW');
    await page.locator('#project-create-name').blur();

    await expect(page.getByText('이름을 입력해 주세요.')).toBeVisible();
    await expect(page.getByRole('button', { name: '세우기' })).toBeDisabled();
  });

  test('GT-42 #5: 목록을 열면 그 사용자의 프로젝트만 작업 아이템 수와 함께 낸다', async ({
    page,
    request,
  }) => {
    // 워커 계정의 것이다. 이어서 바꾸는 계정에는 이것이 보이지 않아야 한다.
    await 프로젝트를_만든다(request, 'Other Place', 'OP');

    await 빈_계정으로_바꾼다(page);
    const 기본 = await 기본_프로젝트(page.request);
    await 작업_아이템을_만든다(page.request, 기본, '첫째');
    await 작업_아이템을_만든다(page.request, 기본, '둘째');

    await page.goto('/projects');

    await expect(page.getByRole('link', { name: /내 프로젝트/ })).toBeVisible();
    await expect(page.getByText('MY · 작업 아이템 2 · 문서 0')).toBeVisible();
    await expect(page.getByRole('link', { name: /Other Place/ })).toHaveCount(0);
  });
});
