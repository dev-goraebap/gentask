import { expect, test } from '../fixtures';
import { 작업_아이템을_만든다, 작업_아이템을_읽는다, 프로젝트를_만든다 } from './tracker-support';

// TG-044 작업 아이템의 상태를 옮긴다
//
// 상태는 상세의 곁의 열이 갖는다(ITM-003). 옮긴 뒤에 다시 실어 보는 것은 화면의 신호가 아니라
// 담긴 것을 보기 위해서다 — 목록과 상세는 서로 다른 리소스라 한쪽만 다시 실으면 어긋난다.

/** 곁의 열에서 상태를 고른다. */
async function 상태를_옮긴다(
  page: import('@playwright/test').Page,
  상태: string,
): Promise<void> {
  await page.locator('aside').getByRole('button', { name: /누르면 바꾸기/ }).click();
  await page
    .getByRole('group', { name: '상태 바꾸기' })
    .getByRole('button', { name: 상태, exact: true })
    .click();
}

/** 지금 상태. 곁의 열의 칩이 그것을 글자로 그린다. */
function 지금_상태(page: import('@playwright/test').Page) {
  return page.locator('aside app-issue-state-chip');
}

test.describe('TG-044 작업 아이템의 상태를 옮긴다', () => {
  test('TG-044 #1: 상태를 옮기면 그 상태를 항목에 남긴다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'State Kept');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '진행 중으로 옮길 것');

    await page.goto(`/projects/${프로젝트}/issues/${항목}`);
    await 상태를_옮긴다(page, '진행 중');

    await expect(지금_상태(page)).toContainText('진행 중');

    // 다시 실어도 남아 있어야 담긴 것이다.
    await page.reload();
    await expect(지금_상태(page)).toContainText('진행 중');
  });

  test('TG-044 #2: 완료나 취소로 옮기면 그 순간을 닫힌 때로 남긴다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Closed At');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '닫을 것');

    await page.goto(`/projects/${프로젝트}/issues/${항목}`);
    await 상태를_옮긴다(page, '닫힘');
    await expect(지금_상태(page)).toContainText('닫힘');

    // 닫힌 때는 목록의 줄이 낸다. 날짜는 서버의 시계가 정하므로 모양만 본다.
    await page.goto(`/projects/${프로젝트}/issues?state=all`);
    await expect(page.getByText(/\d{4}-\d{2}-\d{2} 닫힘/)).toBeVisible();
  });

  test('TG-044 #3: 닫힌 것을 되돌리면 닫힌 때를 지운다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Reopened');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '되돌릴 것');

    await page.goto(`/projects/${프로젝트}/issues/${항목}`);
    await 상태를_옮긴다(page, '닫힘');
    await expect(지금_상태(page)).toContainText('닫힘');

    await 상태를_옮긴다(page, '진행 중');

    await expect(지금_상태(page)).toContainText('진행 중');
    expect((await 작업_아이템을_읽는다(page.request, 항목)).summary.closedAt).toBeNull();
  });

  test('TG-044 #4: 지금 상태와 같은 상태로 옮기면 아무것도 바꾸지 않는다', async ({
    page,
    request,
  }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Same State');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '그대로 둘 것');

    await page.goto(`/projects/${프로젝트}/issues/${항목}`);
    await 상태를_옮긴다(page, '닫힘');
    await expect(지금_상태(page)).toContainText('닫힘');
    const 처음 = (await 작업_아이템을_읽는다(page.request, 항목)).summary.closedAt;

    await 상태를_옮긴다(page, '닫힘');

    // 다시 찍으면 처음 닫은 순간을 잃는다. 화면은 날짜까지만 그리므로 담긴 것을 읽어 견준다.
    expect((await 작업_아이템을_읽는다(page.request, 항목)).summary.closedAt).toBe(처음);
  });
});
