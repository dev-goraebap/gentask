import { expect, test } from '../fixtures';

// TG-002.01 제목만으로 작업 추가
// 인수 조건 하나에 테스트 하나. 접두어의 규약은 결정-0007 이, 계층의 규약은 결정-0008 이 갖는다.

test.describe('TG-002.01 제목만으로 작업 추가', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks/all');
    await expect(page.getByPlaceholder('작업 추가')).toBeVisible();
  });

  test('TG-002.01 #1: 제목을 적고 확정하면 목록에 그 작업이 있다', async ({ page }) => {
    const 입력 = page.getByPlaceholder('작업 추가');

    await 입력.fill('우산 챙기기');
    await 입력.press('Enter');

    await expect(page.getByRole('link', { name: '우산 챙기기' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: '우산 챙기기' })).toBeVisible();
  });

  test('TG-002.01 #2: 제목이 공백뿐이면 작업을 넣지 않는다', async ({ page }) => {
    const 입력 = page.getByPlaceholder('작업 추가');
    // 목록이 서기 전에 세면 사이드바만 세고, 뒤늦게 선 빈 목록 안내가 개수를 바꾼다.
    await expect(page.getByRole('main').getByRole('listitem')).not.toHaveCount(0);
    const 이전 = await page.getByRole('listitem').count();

    await 입력.fill('   ');
    await 입력.press('Enter');

    await expect(page.getByRole('listitem')).toHaveCount(이전);
  });

  test('TG-002.01 #3: 추가를 그만두면 목록을 그대로 둔다', async ({ page }) => {
    const 입력 = page.getByPlaceholder('작업 추가');
    // 목록이 서기 전에 세면 사이드바만 세고, 뒤늦게 선 빈 목록 안내가 개수를 바꾼다.
    await expect(page.getByRole('main').getByRole('listitem')).not.toHaveCount(0);
    const 이전 = await page.getByRole('listitem').count();

    await 입력.fill('적다 만 작업');
    await page.goto('/tasks/important');
    await page.goto('/tasks/all');

    await expect(page.getByRole('listitem')).toHaveCount(이전);
    await expect(page.getByRole('link', { name: '적다 만 작업' })).toHaveCount(0);
  });

  // 트리거가 셋이므로 파라미터화한다. 인수 조건은 하나다.
  for (const [스마트목록, 경로] of [
    ['오늘', '/tasks/my-day'],
    ['중요', '/tasks/important'],
    ['기한', '/tasks/planned'],
  ] as const) {
    test(`TG-002.01 #4: ${스마트목록} 목록을 보는 중에 적으면 그 성질이 붙는다`, async ({ page }) => {
      await page.goto(경로);
      const 제목 = `${스마트목록} 목록에서 적은 작업`;
      const 입력 = page.getByPlaceholder('작업 추가');

      await 입력.fill(제목);
      await 입력.press('Enter');
      await expect(page.getByRole('link', { name: 제목 })).toBeVisible();

      // 성질이 실제로 붙었으면 그 스마트 목록을 다시 열어도 남는다.
      await page.reload();
      await expect(page.getByRole('link', { name: 제목 })).toBeVisible();
    });
  }

  test('TG-002.01 #5: 제목이 공백뿐이면 오류를 알리지 않는다', async ({ page }) => {
    const 입력 = page.getByPlaceholder('작업 추가');

    await 입력.fill('   ');
    await 입력.press('Enter');

    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
