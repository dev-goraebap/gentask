import { 빈_계정으로_바꾼다, expect, test } from '../fixtures';

// GT-29 에이전트 토큰 발급
//
// AC2 · AC3 · AC4 는 [서버]다. 이전 토큰의 무효화와 Bearer 인증과 접근 차단은
// 브라우저가 보내지 않는 요청이므로 백엔드 통합 테스트가 갖는다.

/**
 * 발급된 원문 토큰.
 *
 * <p>자리를 id 로 짚는다. 이 섹션에는 붙이는 절차를 알리는 `code` 가 여럿 있어 태그로 고르면
 * 안내 문구가 바뀔 때마다 이 시험이 함께 깨진다.
 */
function 토큰상자(page: import('@playwright/test').Page) {
  return page.locator('#agent-token');
}

test.describe('GT-29 에이전트 토큰 발급', () => {
  test('GT-29 #1: 발급하면 그 자리에서 토큰 원문을 보여 준다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await page.goto('/me');
    await expect(page.getByText('아직 발급한 토큰이 없습니다.')).toBeVisible();

    await page.getByRole('button', { name: '발급', exact: true }).click();

    await expect(토큰상자(page)).not.toBeEmpty();
    await expect(page.getByText('이 화면을 떠나면 다시 볼 수 없습니다.')).toBeVisible();
  });

  test('GT-29 #5: 화면을 다시 열면 원문은 없고 발급 사실만 남는다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await page.goto('/me');
    await page.getByRole('button', { name: '발급', exact: true }).click();
    const 원문 = (await 토큰상자(page).textContent()) ?? '';
    expect(원문).not.toBe('');

    await page.reload();

    await expect(page.getByText('원문은 발급할 때만 보입니다')).toBeVisible();
    await expect(토큰상자(page)).toHaveCount(0);
    await expect(page.getByText(원문)).toHaveCount(0);
  });
});
