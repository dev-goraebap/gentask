import { expect, test } from '../fixtures';
import { 작업_아이템을_만든다, 프로젝트를_만든다 } from './tracker-support';

// 작업 아이템을 지운다
//
// 취소(CANCELED)와 달리 삭제는 항목을 영구 제거한다(ITM-005). 복구 기능이 없으므로 확인 다이얼로그를 거친다.

/** 삭제 확인 다이얼로그를 연다. */
async function 지우기를_연다(page: import('@playwright/test').Page): Promise<void> {
  await page.getByRole('button', { name: '작업 아이템 지우기' }).click();
}

test.describe('작업 아이템을 지운다', () => {
  test('지우겠다고 하면 무엇을 지우는지 보이고 되묻는다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Ask First');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '지울지 되물을 것');

    await page.goto(`/projects/${프로젝트}/issues/${항목}`);
    await 지우기를_연다(page);

    await expect(page.getByRole('alertdialog')).toContainText(항목);
    await expect(page.getByRole('alertdialog')).toContainText('지울지 되물을 것');
    await expect(page.getByRole('alertdialog')).toContainText('되돌릴 수 없습니다');
  });

  test('지우기를 확인하면 지우고 목록으로 되돌린다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Really Gone');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '걷을 것');

    await page.goto(`/projects/${프로젝트}/issues/${항목}`);
    await 지우기를_연다(page);
    await page.getByRole('button', { name: '지우기', exact: true }).click();

    await expect(page).toHaveURL(`/projects/${프로젝트}/issues`);
    await expect(page.getByRole('link', { name: '걷을 것' })).toHaveCount(0);
  });

  test('삭제 확인 다이얼로그에서 취소하면 항목이 삭제되지 않는다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Kept After All');
    const 항목 = await 작업_아이템을_만든다(request, 프로젝트, '남아 있을 것');

    await page.goto(`/projects/${프로젝트}/issues/${항목}`);
    await 지우기를_연다(page);
    await page.getByRole('button', { name: '그만두기' }).click();

    await expect(page.getByRole('heading', { name: '남아 있을 것' })).toBeVisible();

    await page.goto(`/projects/${프로젝트}/issues`);
    await expect(page.getByRole('link', { name: '남아 있을 것' })).toBeVisible();
  });

  test('자식이 딸려 있으면 지우지 않고 최상위로 올린다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Orphan Kept');
    const 부모 = await 작업_아이템을_만든다(request, 프로젝트, '걷을 에픽', { kind: 'EPIC' });
    const 자식 = await 작업_아이템을_만든다(request, 프로젝트, '남을 자식', { parentKey: 부모 });

    await page.goto(`/projects/${프로젝트}/issues/${부모}`);
    await 지우기를_연다(page);
    // 몇 개가 올라오는지 먼저 보인다. 나중에 왜 최상위인지 알 길이 없는 대가를 여기서 줄인다.
    await expect(page.getByRole('alertdialog')).toContainText('딸린 1개');
    await page.getByRole('button', { name: '지우기', exact: true }).click();

    await expect(page).toHaveURL(`/projects/${프로젝트}/issues`);
    await expect(page.getByRole('link', { name: '남을 자식' })).toBeVisible();

    await page.goto(`/projects/${프로젝트}/issues/${자식}`);
    await expect(page.locator('aside').getByText('최상위 항목입니다')).toBeVisible();
  });
});
