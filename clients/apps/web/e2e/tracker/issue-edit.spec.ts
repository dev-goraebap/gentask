import { expect, test } from '../fixtures';
import {
  본문을_적는다,
  인수_조건을_적는다,
  작업_아이템을_만든다,
  프로젝트를_만든다,
} from './tracker-support';

// 작업 아이템을 고친다
//
// 고치는 것은 제목 · 유형 · 본문 셋이다. 번호는 불변이고 상태는 ITM-003 이 갖는다(ITM-004).
// 인수 조건을 따로 고치지 않는 것은 그것이 본문 안의 체크 항목이기 때문이다.

/** 상세를 열고 고치기로 들어간다. */
async function 고치기를_연다(
  page: import('@playwright/test').Page,
  projectId: string,
  key: string,
): Promise<void> {
  await page.goto(`/projects/${projectId}/issues/${key}`);
  await page.getByRole('button', { name: '고치기' }).click();
  await expect(page.locator('#issue-edit-title')).toBeVisible();
}

test.describe('작업 아이템을 고친다', () => {
  test('제목과 본문을 고쳐 담으면 고친 것을 남긴다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Edit Kept');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '고치기 전 제목', {
      body: '고치기 전 본문',
    });

    await 고치기를_연다(page, 프로젝트, 항목);
    await page.locator('#issue-edit-title').fill('고친 제목');
    await 본문을_적는다(page, '고친 본문');
    await page.getByRole('button', { name: '담기' }).click();

    await expect(page.getByRole('heading', { name: '고친 제목' })).toBeVisible();
    await expect(page.getByText('고친 본문')).toBeVisible();

    // 다시 실어도 남아 있어야 담긴 것이다.
    await page.reload();
    await expect(page.getByRole('heading', { name: '고친 제목' })).toBeVisible();
    await expect(page.getByText('고친 본문')).toBeVisible();
  });

  test('본문의 체크 항목을 고치면 바뀐 인수 조건을 그대로 읽는다', async ({
    page,
    request,
  }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Criteria Read');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '인수 조건이 있는 것', {
      body: '- [ ] #1 고치기 전 조건',
    });

    // 본문의 체크 항목이 읽는 자리에도 그대로 그려진다. 세어 낸 쪽만 본다.
    const 인수조건 = page.getByRole('list', { name: '인수 조건' });

    await page.goto(`/projects/${프로젝트}/issues/${항목}`);
    await expect(인수조건.getByText('고치기 전 조건')).toBeVisible();

    await page.getByRole('button', { name: '고치기' }).click();
    await 인수_조건을_적는다(page, '#1 고친 조건');
    await page.getByRole('button', { name: '담기' }).click();

    await expect(인수조건.getByText('고친 조건')).toBeVisible();
    await expect(인수조건.getByText('고치기 전 조건')).toHaveCount(0);
  });

  test('제목이 비어 있으면 알리고 고치기 전의 것을 그대로 둔다', async ({
    page,
    request,
  }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Empty Edit');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '비우지 못할 제목');

    await 고치기를_연다(page, 프로젝트, 항목);
    await page.locator('#issue-edit-title').fill('   ');

    await expect(page.getByText('제목을 입력해 주세요.')).toBeVisible();
    await expect(page.getByRole('button', { name: '담기' })).toBeDisabled();

    await page.reload();
    await expect(page.getByRole('heading', { name: '비우지 못할 제목' })).toBeVisible();
  });

  test('고치기를 그만두면 고치기 전의 것을 그대로 둔다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Edit Dismissed');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '그대로 둘 제목', {
      body: '그대로 둘 본문',
    });

    await 고치기를_연다(page, 프로젝트, 항목);
    await page.locator('#issue-edit-title').fill('버려질 제목');
    await 본문을_적는다(page, '버려질 본문');
    await page.getByRole('button', { name: '그만두기' }).click();

    await expect(page.getByRole('heading', { name: '그대로 둘 제목' })).toBeVisible();
    await expect(page.getByText('그대로 둘 본문')).toBeVisible();
    await expect(page.getByText('버려질 제목')).toHaveCount(0);
  });

  test('유형을 바꾸면 번호를 그대로 두고 유형만 바꾼다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Kind Changed');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '유형을 바꿀 것');

    await 고치기를_연다(page, 프로젝트, 항목);
    await page.getByRole('button', { name: /^유형 .*누르면 바꾸기$/ }).click();
    await page
      .getByRole('group', { name: '작업 아이템의 유형' })
      .getByRole('button', { name: '버그' })
      .click();
    await page.getByRole('button', { name: '담기' }).click();

    await expect(page.locator('aside').getByText('버그')).toBeVisible();
    // 넷이 한 표에 있어 옮길 자리가 없다. 번호가 따라 바뀔 이유가 없다(ITM-004 A3).
    await expect(page.getByText(항목, { exact: true })).toBeVisible();
    await expect(page).toHaveURL(`/projects/${프로젝트}/issues/${항목}`);
  });
});
