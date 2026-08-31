import { 빈_계정으로_바꾼다, 작업을_만든다, expect, test } from '../fixtures';

// 계정을 바꾼 뒤에는 브라우저 문맥과 세션을 공유하는 page.request 로 준비 데이터를 만든다.

// TG-002.03 완료되지 않은 작업 보기

test.describe('TG-002.03 완료되지 않은 작업 보기', () => {
  test('TG-002.03 #1: 목록을 열면 완료되지 않은 작업만 보여 준다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await 작업을_만든다(page.request, '남아 있을 작업');
    await 작업을_만든다(page.request, '완료할 작업');

    await page.goto('/tasks/all');
    await page.getByRole('checkbox', { name: '완료할 작업' }).click();
    // 체크에는 유예가 있다. 목록에서 빠지는 것을 본 뒤에 새로고침해야 저장이 끝난 상태다.
    await expect(page.getByRole('link', { name: '완료할 작업' })).toHaveCount(0);
    await page.reload();

    await expect(page.getByRole('link', { name: '남아 있을 작업' })).toBeVisible();
    await expect(page.getByRole('link', { name: '완료할 작업' })).toHaveCount(0);
  });

  test('TG-002.03 #2: 해당하는 작업이 없으면 고를 일이 없음을 알린다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);

    await page.goto('/tasks/all');

    await expect(page.getByText('작업이 없습니다')).toBeVisible();
  });

  test('TG-002.03 #4: 해당하는 작업이 없으면 다음 행동을 안내한다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);

    await page.goto('/tasks/all');

    await expect(page.getByText('아래에 입력해 하나 추가해 보세요.')).toBeVisible();
  });

  test('TG-002.03 #3: 모르는 스마트 목록을 요청하면 완료되지 않은 작업 전체를 보여 준다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await 작업을_만든다(page.request, '모르는 목록에서도 보일 작업');

    await page.goto('/tasks/알수없는목록');

    await expect(page.getByRole('link', { name: '모르는 목록에서도 보일 작업' })).toBeVisible();
  });
});
