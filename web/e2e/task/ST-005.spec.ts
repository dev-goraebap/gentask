import { 빈_계정으로_바꾼다, 작업을_만든다, 하위_자원을_바꾼다, expect, test } from '../fixtures';

// ST-005 스마트 목록으로 작업 보기
//
// AC1(완료된 작업 스마트 목록)은 시나리오가 없다. 화면의 스마트 목록은
// all · my-day · important · planned 넷이며 완료된 작업은 목록 하단의 접이식 구획이다.
// 인수 조건과 구현이 어긋난 자리이므로 요구사항 쪽에서 먼저 정해야 한다.

function 내일(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

test.describe('ST-005 스마트 목록으로 작업 보기', () => {
  test('ST-005 AC2: 나의 하루 목록은 나의 하루에 추가된 완료되지 않은 작업만 보여 준다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);
    const 담은것 = await 작업을_만든다(page.request, '나의 하루에 담은 작업');
    await 작업을_만든다(page.request, '담지 않은 작업');
    await 하위_자원을_바꾼다(page.request, 담은것, 'my-day', { inMyDay: true });

    await page.goto('/tasks/my-day');

    await expect(page.getByRole('link', { name: '나의 하루에 담은 작업' })).toBeVisible();
    await expect(page.getByRole('link', { name: '담지 않은 작업' })).toHaveCount(0);
  });

  test('ST-005 AC3: 중요 목록은 중요하다고 표시한 완료되지 않은 작업만 보여 준다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);
    const 중요한것 = await 작업을_만든다(page.request, '중요 표시한 작업');
    await 작업을_만든다(page.request, '중요하지 않은 작업');
    await 하위_자원을_바꾼다(page.request, 중요한것, 'importance', { important: true });

    await page.goto('/tasks/important');

    await expect(page.getByRole('link', { name: '중요 표시한 작업' })).toBeVisible();
    await expect(page.getByRole('link', { name: '중요하지 않은 작업' })).toHaveCount(0);
  });

  test('ST-005 AC4: 계획된 일정 목록은 기한이 있는 완료되지 않은 작업만 보여 준다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);
    await 작업을_만든다(page.request, '기한이 있는 작업', { dueDate: 내일() });
    await 작업을_만든다(page.request, '기한이 없는 작업');

    await page.goto('/tasks/planned');

    await expect(page.getByRole('link', { name: '기한이 있는 작업' })).toBeVisible();
    await expect(page.getByRole('link', { name: '기한이 없는 작업' })).toHaveCount(0);
  });
});
