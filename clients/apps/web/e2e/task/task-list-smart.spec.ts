import { 빈_계정으로_바꾼다, 작업을_만든다, 하위_자원을_바꾼다, expect, test } from '../fixtures';

// 스마트 목록으로 작업 보기
//
// 완료된 작업은 별도의 스마트 목록이 아니라 각 목록 하단의 접힌 목록이다.
// 그래서 AC1 은 그 목록이 무엇을 담는가를 묻는다. 완료 자체는 작업 완료 시험이 갖는다.

function 내일(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

test.describe('스마트 목록으로 작업 보기', () => {
  test('완료 목록을 펼치면 보고 있는 스마트 목록의 완료된 작업만 나온다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);
    const 중요한것 = await 작업을_만든다(page.request, '중요한 완료 작업');
    const 평범한것 = await 작업을_만든다(page.request, '평범한 완료 작업');
    await 하위_자원을_바꾼다(page.request, 중요한것, 'importance', { important: true });
    await 하위_자원을_바꾼다(page.request, 중요한것, 'completion', { completed: true });
    await 하위_자원을_바꾼다(page.request, 평범한것, 'completion', { completed: true });

    await page.goto('/todo/important');
    await page.getByRole('button', { name: /완료 \d+개/ }).click();

    const 완료목록 = page.locator('#completed-tasks');
    await expect(완료목록.getByRole('link', { name: '중요한 완료 작업' })).toBeVisible();
    await expect(완료목록.getByRole('link', { name: '평범한 완료 작업' })).toHaveCount(0);
  });

  test('나의 하루 목록은 나의 하루에 추가된 완료되지 않은 작업만 보여 준다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);
    const 담은것 = await 작업을_만든다(page.request, '나의 하루에 담은 작업');
    await 작업을_만든다(page.request, '담지 않은 작업');
    await 하위_자원을_바꾼다(page.request, 담은것, 'my-day', { inMyDay: true });

    await page.goto('/todo/my-day');

    await expect(page.getByRole('link', { name: '나의 하루에 담은 작업' })).toBeVisible();
    await expect(page.getByRole('link', { name: '담지 않은 작업' })).toHaveCount(0);
  });

  test('중요 목록은 중요하다고 표시한 완료되지 않은 작업만 보여 준다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);
    const 중요한것 = await 작업을_만든다(page.request, '중요 표시한 작업');
    await 작업을_만든다(page.request, '중요하지 않은 작업');
    await 하위_자원을_바꾼다(page.request, 중요한것, 'importance', { important: true });

    await page.goto('/todo/important');

    await expect(page.getByRole('link', { name: '중요 표시한 작업' })).toBeVisible();
    await expect(page.getByRole('link', { name: '중요하지 않은 작업' })).toHaveCount(0);
  });

  test('계획된 일정 목록은 기한이 있는 완료되지 않은 작업만 보여 준다', async ({
    page,
  }) => {
    await 빈_계정으로_바꾼다(page);
    await 작업을_만든다(page.request, '기한이 있는 작업', { dueDate: 내일() });
    await 작업을_만든다(page.request, '기한이 없는 작업');

    await page.goto('/todo/planned');

    await expect(page.getByRole('link', { name: '기한이 있는 작업' })).toBeVisible();
    await expect(page.getByRole('link', { name: '기한이 없는 작업' })).toHaveCount(0);
  });
});
