import { expect, test } from '../fixtures';
import { 작업_아이템을_만든다, 프로젝트를_만든다 } from './tracker-support';

// 이미 선 프로젝트의 접두어를 고치는 자리.
//
// 세우면서 정하는 흐름은 project-create 가 지난다.

test.describe('접두어를 고친다', () => {
  test('접두어를 바꾸면 이미 매겨진 번호를 그대로 둔다', async ({ page, request }) => {
    const 프로젝트 = await 프로젝트를_만든다(request, 'Prefix Changed', 'OLD');
    await 작업_아이템을_만든다(request, 프로젝트, '번호가 매겨진 것');

    await page.goto(`/projects/${프로젝트}/settings`);
    await page.locator('#project-key').fill('NEW');
    await page.getByRole('button', { name: '담기' }).click();

    /*
     * 접두어는 이름을 그리는 데만 쓰이고 번호는 표가 갖는다. Jira 는 key 를 바꾸면 이슈 키가 전부
     * 바뀌는데, 우리는 주소를 식별자가 맡으므로 번호가 따라 바뀔 이유가 없다.
     */
    await page.goto(`/projects/${프로젝트}/issues`);
    await expect(page.getByText('NEW-1')).toBeVisible();
    await expect(page.getByText('OLD-1')).toHaveCount(0);

    // 주소도 그대로다. 접두어를 바꿔도 이 프로젝트를 가리키는 값은 움직이지 않는다.
    await page.goto(`/projects/${프로젝트}/issues/NEW-1`);
    await expect(page.getByRole('heading', { name: '번호가 매겨진 것' })).toBeVisible();
  });
});
