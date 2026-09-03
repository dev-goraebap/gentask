import { expect, test } from '../fixtures';
import { 본문을_적는다, 이름, 작업_아이템을_만든다, 프로젝트를_만든다 } from './tracker-support';

// 작업 항목 생성 및 조회
//
// 시나리오별로 프로젝트를 새로 생성하여 일련번호 정합성을 보장한다(ITM-001).

/** 테스트용 프로젝트 키 접두어다. */
const 접두어 = 'TS';

/** 작업 항목 생성 다이얼로그를 열고 제목을 입력한다. */
async function 제목을_적는다(
  page: import('@playwright/test').Page,
  projectId: string,
  제목: string,
): Promise<void> {
  await page.goto(`/projects/${projectId}/issues`);
  await page.getByRole('link', { name: '새 작업 아이템' }).click();
  await expect(page.locator('#issue-title')).toBeVisible();
  await page.locator('#issue-title').fill(제목);
}

test.describe('작업 항목 생성 및 조회', () => {
  // 작업 표시 키는 0 채움 없는 번호 형태(TS-1)로 표기된다.
  test('제목을 입력하여 생성하면 현재 프로젝트의 다음 일련번호가 부여된다', async ({
    page,
    request,
  }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Number Order');

    await 제목을_적는다(page, 프로젝트, '첫 번째로 세울 것');
    await page.getByRole('button', { name: '세우기' }).click();
    await expect(page).toHaveURL(`/projects/${프로젝트}/issues/${이름(접두어, 1)}`);

    await 제목을_적는다(page, 프로젝트, '두 번째로 세울 것');
    await page.getByRole('button', { name: '세우기' }).click();

    await expect(page).toHaveURL(`/projects/${프로젝트}/issues/${이름(접두어, 2)}`);
  });

  test('유형을 선택하지 않고 생성하면 기본 Task 유형으로 생성된다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Default Kind');

    await 제목을_적는다(page, 프로젝트, '유형을 고르지 않은 것');
    await page.getByRole('button', { name: '세우기' }).click();

    await expect(page).toHaveURL(`/projects/${프로젝트}/issues/${이름(접두어, 1)}`);
    // 테이블 행의 유형 열과 생성 다이얼로그의 선택자를 구분하여 지정한다.
    await expect(page.locator('aside').getByText('태스크')).toBeVisible();
  });

  test('본문을 입력하여 생성하면 해당 본문이 저장된다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Body Kept');

    await 제목을_적는다(page, 프로젝트, '본문이 있는 것');
    await 본문을_적는다(page, '적은 그대로 담겨야 한다');
    await page.getByRole('button', { name: '세우기' }).click();

    await expect(page).toHaveURL(`/projects/${프로젝트}/issues/${이름(접두어, 1)}`);
    await expect(page.getByText('적은 그대로 담겨야 한다')).toBeVisible();

    // 다시 실어도 남아 있어야 담긴 것이다.
    await page.reload();
    await expect(page.getByText('적은 그대로 담겨야 한다')).toBeVisible();
  });

  test('제목이 비어 있으면 제목이 필요함을 알린다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Empty Title');

    await 제목을_적는다(page, 프로젝트, '   ');
    await page.locator('#issue-title').blur();

    await expect(page.getByText('제목을 입력해 주세요.')).toBeVisible();
    await expect(page.getByRole('button', { name: '세우기' })).toBeDisabled();
  });

  test('목록을 열면 지금 프로젝트의 작업 아이템만 낸다', async ({ page, request }) => {
    const 이쪽 = await 프로젝트를_만든다(request, 'This Side');
    const 저쪽 = await 프로젝트를_만든다(request, 'That Side');
    await 작업_아이템을_만든다(request, 이쪽, '이쪽에 있는 것');
    await 작업_아이템을_만든다(request, 저쪽, '저쪽에 있는 것');

    await page.goto(`/projects/${이쪽}/issues`);

    await expect(page.getByRole('link', { name: '이쪽에 있는 것' })).toBeVisible();
    await expect(page.getByRole('link', { name: '저쪽에 있는 것' })).toHaveCount(0);
  });

  test('하나를 열면 본문과 부모를 함께 낸다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Parent Shown');
    const 부모 = await 작업_아이템을_만든다(request, 프로젝트, '덮는 에픽', { kind: 'EPIC' });
    const 자식 = await 작업_아이템을_만든다(request, 프로젝트, '에픽에 딸린 것', {
      body: '부모와 함께 나와야 하는 본문',
      parentKey: 부모,
    });

    await page.goto(`/projects/${프로젝트}/issues/${자식}`);

    await expect(page.getByText('부모와 함께 나와야 하는 본문')).toBeVisible();
    await expect(page.getByRole('link', { name: /덮는 에픽/ }).first()).toBeVisible();
  });
});
