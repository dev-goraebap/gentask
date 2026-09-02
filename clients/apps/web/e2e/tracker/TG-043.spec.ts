import { expect, test } from '../fixtures';
import {
  본문을_적는다,
  이름,
  작업_아이템을_만든다,
  프로젝트를_만든다,
} from './tracker-support';

// TG-043 작업 아이템을 세우고 본다
//
// 시나리오마다 프로젝트를 새로 세운다. 번호는 프로젝트 안에서 1 부터 매겨지므로(ITM-001) 그
// 자리를 함께 쓰면 몇 번이 나오는지가 앞선 시나리오에 달리게 된다.

/** 세우는 덮개를 열고 제목을 적는다. */
async function 제목을_적는다(
  page: import('@playwright/test').Page,
  projectKey: string,
  제목: string,
): Promise<void> {
  await page.goto(`/projects/${projectKey}/issues`);
  await page.getByRole('link', { name: '새 작업 아이템' }).click();
  await expect(page.locator('#issue-title')).toBeVisible();
  await page.locator('#issue-title').fill(제목);
}

test.describe('TG-043 작업 아이템을 세우고 본다', () => {
  test('TG-043 #1: 제목을 적어 세우면 지금 프로젝트의 다음 번호를 매긴다', async ({
    page,
    request,
  }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Number Order');

    await 제목을_적는다(page, 프로젝트, '첫 번째로 세울 것');
    await page.getByRole('button', { name: '세우기' }).click();
    await expect(page).toHaveURL(`/projects/${프로젝트}/issues/${이름(프로젝트, 1)}`);

    await 제목을_적는다(page, 프로젝트, '두 번째로 세울 것');
    await page.getByRole('button', { name: '세우기' }).click();

    await expect(page).toHaveURL(`/projects/${프로젝트}/issues/${이름(프로젝트, 2)}`);
  });

  test('TG-043 #2: 유형을 고르지 않고 세우면 Task 로 선다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Default Kind');

    await 제목을_적는다(page, 프로젝트, '유형을 고르지 않은 것');
    await page.getByRole('button', { name: '세우기' }).click();

    await expect(page).toHaveURL(`/projects/${프로젝트}/issues/${이름(프로젝트, 1)}`);
    // 유형은 곁의 열이 낸다. 세우는 덮개의 고르개와 같은 낱말을 쓰므로 자리를 좁혀 본다.
    await expect(page.locator('aside').getByText('태스크')).toBeVisible();
  });

  test('TG-043 #3: 본문을 적어 세우면 그 본문을 그대로 담는다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Body Kept');

    await 제목을_적는다(page, 프로젝트, '본문이 있는 것');
    await 본문을_적는다(page, '적은 그대로 담겨야 한다');
    await page.getByRole('button', { name: '세우기' }).click();

    await expect(page).toHaveURL(`/projects/${프로젝트}/issues/${이름(프로젝트, 1)}`);
    await expect(page.getByText('적은 그대로 담겨야 한다')).toBeVisible();

    // 다시 실어도 남아 있어야 담긴 것이다.
    await page.reload();
    await expect(page.getByText('적은 그대로 담겨야 한다')).toBeVisible();
  });

  test('TG-043 #4: 제목이 비어 있으면 제목이 필요함을 알린다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Empty Title');

    await 제목을_적는다(page, 프로젝트, '   ');
    await page.locator('#issue-title').blur();

    await expect(page.getByText('제목을 입력해 주세요.')).toBeVisible();
    await expect(page.getByRole('button', { name: '세우기' })).toBeDisabled();
  });

  test('TG-043 #6: 목록을 열면 지금 프로젝트의 작업 아이템만 낸다', async ({ page, request }) => {
    const 이쪽 = await 프로젝트를_만든다(request, 'This Side');
    const 저쪽 = await 프로젝트를_만든다(request, 'That Side');
    await 작업_아이템을_만든다(request, 이쪽, '이쪽에 있는 것');
    await 작업_아이템을_만든다(request, 저쪽, '저쪽에 있는 것');

    await page.goto(`/projects/${이쪽}/issues`);

    await expect(page.getByRole('link', { name: '이쪽에 있는 것' })).toBeVisible();
    await expect(page.getByRole('link', { name: '저쪽에 있는 것' })).toHaveCount(0);
  });

  test('TG-043 #7: 하나를 열면 본문과 부모를 함께 낸다', async ({ page, request }) => {
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
