import { 빈_계정으로_바꾼다, expect, test } from '../fixtures';
import { 작업_아이템을_만든다, 프로젝트를_만든다 } from './tracker-support';

// TG-042 프로젝트를 세우고 고른다
//
// 접두어는 사용자가 고르는 것이 아니라 이름에서 뽑힌다(PRJ-001). 그래서 어떤 접두어가 나오는지가
// 그 계정에 이미 선 프로젝트에 달려 있다. 빈 계정으로 바꾸고 시작하는 시나리오는 기본 프로젝트
// 하나(`내 프로젝트` · `P`)만 서 있는 자리를 만들어, 뽑히는 접두어를 결정적으로 만든다.

/** 세우는 덮개를 열고 이름을 적는다. */
async function 이름을_적는다(page: import('@playwright/test').Page, 이름: string): Promise<void> {
  await page.goto('/projects');
  await page.getByRole('link', { name: '새 프로젝트' }).click();
  await expect(page.locator('#project-create-name')).toBeVisible();
  await page.locator('#project-create-name').fill(이름);
}

test.describe('TG-042 프로젝트를 세우고 고른다', () => {
  test('TG-042 #1: 이름을 적어 세우면 그 이름에서 뽑은 접두어와 함께 선다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);

    await 이름을_적는다(page, 'Gentask Web');
    await page.getByRole('button', { name: '세우기' }).click();

    // 세운 자리로 곧장 들어간다. 주소가 UUID 가 아니라 접두어를 담는다.
    await expect(page).toHaveURL('/projects/GE/issues');

    await page.goto('/projects');
    await expect(page.getByText('GE · 작업 아이템 0 · 문서 0')).toBeVisible();
  });

  test('TG-042 #2: 뽑은 접두어를 이미 가지고 있으면 겹치지 않는 것을 붙인다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);

    await 이름을_적는다(page, 'Alpha');
    await page.getByRole('button', { name: '세우기' }).click();
    await expect(page).toHaveURL('/projects/AL/issues');

    // 같은 두 글자가 뽑히는 이름이다. 되묻지 않고 뒤에 숫자를 붙인다(PRJ-001 A2).
    await 이름을_적는다(page, 'Album');
    await page.getByRole('button', { name: '세우기' }).click();

    await expect(page).toHaveURL('/projects/AL2/issues');
  });

  test('TG-042 #4: 이름이 비어 있으면 이름이 필요함을 알린다', async ({ page }) => {
    await 이름을_적는다(page, '   ');
    await page.locator('#project-create-name').blur();

    await expect(page.getByText('이름을 입력해 주세요.')).toBeVisible();
    await expect(page.getByRole('button', { name: '세우기' })).toBeDisabled();
  });

  test('TG-042 #5: 목록을 열면 그 사용자의 프로젝트만 작업 아이템 수와 함께 낸다', async ({
    page,
    request,
  }) => {
    // 워커 계정의 것이다. 이어서 바꾸는 계정에는 이것이 보이지 않아야 한다.
    await 프로젝트를_만든다(request, 'Other Place');

    await 빈_계정으로_바꾼다(page);
    await 작업_아이템을_만든다(page.request, 'P', '첫째');
    await 작업_아이템을_만든다(page.request, 'P', '둘째');

    await page.goto('/projects');

    await expect(page.getByRole('link', { name: /내 프로젝트/ })).toBeVisible();
    await expect(page.getByText('P · 작업 아이템 2 · 문서 0')).toBeVisible();
    await expect(page.getByRole('link', { name: /Other Place/ })).toHaveCount(0);
  });

  test('TG-042 #7: 이름에 영문과 숫자가 하나도 없으면 영문 접두어를 대신 붙인다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);

    await 이름을_적는다(page, '한글로만 지은 이름');
    await page.getByRole('button', { name: '세우기' }).click();

    // 뽑을 것이 없으면 `P` 를 쓴다(PRJ-001 A5). 기본 프로젝트가 그것을 이미 가지고 있으므로
    // 겹침을 푸는 규칙이 이어서 걸린다.
    await expect(page).toHaveURL('/projects/P2/issues');
  });
});
