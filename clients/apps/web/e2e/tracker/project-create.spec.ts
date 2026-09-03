import { 빈_계정으로_바꾼다, expect, test } from '../fixtures';
import { 기본_프로젝트, 작업_아이템을_만든다, 프로젝트를_만든다 } from './tracker-support';

// 프로젝트 생성
//
// 이름과 접두어를 함께 받는다. 접두어를 이름에서 뽑던 규칙은 걷었다 — 한글로만 지은 이름에서 남는
// 것이 없어 뜻 없는 값이 나왔다. 주소가 담는 식별자는 사람이 정하지 않고 시스템이 만든다.

/** 프로젝트 생성 다이얼로그를 열고 이름과 접두어를 입력한다. */
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

test.describe('프로젝트 생성 및 선택', () => {
  test('이름과 접두어를 입력하여 생성하면 시스템이 부여한 공개 식별자 URL로 이동한다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);

    await 적는다(page, 'Gentask Web', 'GW');
    await page.getByRole('button', { name: '세우기' }).click();

    // 생성 완료 시 해당 프로젝트의 공개 식별자 URL로 자동 이동한다.
    await expect(page).toHaveURL(/^http:\/\/localhost:4200\/projects\/[\w-]{12}\/issues$/);

    await page.goto('/projects');
    await expect(page.getByText('GW · 작업 아이템 0 · 문서 0')).toBeVisible();
  });

  test('접두어가 비어 있거나 모양에 맞지 않으면 알린다', async ({ page }) => {
    await 적는다(page, '접두어를 잘못 적은 것', '한글');
    await page.locator('#project-create-key').blur();

    await expect(page.getByText('접두어는 영문과 숫자만 쓸 수 있습니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: '세우기' })).toBeDisabled();
  });

  /*
   * 접두어는 작업 항목 키에만 사용되며 고유 식별은 공개 식별자(URL)가 담당하므로 동일 접두어의 프로젝트 생성을 허용한다.
   */
  test('접두어가 중복되어도 정상적으로 생성된다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);

    await 적는다(page, '첫째', 'DUP');
    await page.getByRole('button', { name: '세우기' }).click();
    // 생성 완료 후 프로젝트 이슈 목록 URL로 이동한 상태를 검증한다.
    await expect(page).toHaveURL(/\/issues$/);
    const 첫째 = page.url();

    await 적는다(page, '둘째', 'DUP');
    await page.getByRole('button', { name: '세우기' }).click();
    await expect(page).toHaveURL(/\/issues$/);

    expect(page.url()).not.toBe(첫째);
    await page.goto('/projects');
    await expect(page.getByText('DUP · 작업 아이템 0 · 문서 0')).toHaveCount(2);
  });

  test('이름이 비어 있으면 이름이 필요함을 알린다', async ({ page }) => {
    await 적는다(page, '   ', 'GW');
    await page.locator('#project-create-name').blur();

    await expect(page.getByText('이름을 입력해 주세요.')).toBeVisible();
    await expect(page.getByRole('button', { name: '세우기' })).toBeDisabled();
  });

  test('목록을 열면 그 사용자의 프로젝트만 작업 아이템 수와 함께 낸다', async ({
    page,
    request,
  }) => {
    // 다른 사용자 계정의 프로젝트는 프로젝트 목록에 표시되지 않는다.
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
