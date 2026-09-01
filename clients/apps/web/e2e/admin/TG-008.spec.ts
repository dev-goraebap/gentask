import { randomUUID } from 'node:crypto';
import { expect, test } from '../fixtures';
import { 관리자로_들어간다, 일반_사용자를_만든다 } from './admin-support';

// TG-008 플랫폼 운영
//
// 관리자 계정이 서버 설정으로 정해진 하나뿐이라 이 파일의 시험이 그것을 나눠 쓴다. 같은 계정의 권한을
// 동시에 건드리면 서로의 결과를 덮으므로 차례로 돈다.
//
// TG-037 의 다섯은 [서버]다. 실패한 발송이 있어야 목록이 서는데 그것을 브라우저로 만들 수 없다 —
// 스케줄러가 1분 주기라 기다릴 수 없다. 아래 마지막 시험은 그 자리가 화면에 서는 것만 지키며 인수
// 조건을 갖지 않는다.

test.describe.configure({ mode: 'serial' });

test.describe('TG-008 플랫폼 운영', () => {
  test('TG-036 #5: 관리자가 아니면 관리 화면에 들어가지 못한다', async ({ page }) => {
    // 워커의 계정은 일반 사용자다. 관리자로 바꾸지 않은 채 곧바로 연다
    await page.goto('/admin/users');

    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.getByRole('heading', { name: '사용자 관리' })).toHaveCount(0);
  });

  test('TG-036 #1: 관리 화면은 가입한 사용자를 최근 가입 순으로 보여 준다', async ({ page }) => {
    // 두 사람을 차례로 만들고 그 둘만 남겨 순서를 본다. 목록 전체에서 자리를 세면 다른 시험이 만든
    // 계정에 밀려 간헐적으로 어긋난다.
    const 무리 = randomUUID().slice(0, 8);
    const 먼저 = await 일반_사용자를_만든다(page, `a-${무리}`);
    const 나중 = await 일반_사용자를_만든다(page, `b-${무리}`);
    await 관리자로_들어간다(page);

    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: '사용자 관리' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '이메일' })).toBeVisible();

    await page.locator('#admin-user-search').fill(무리);
    await page.getByRole('button', { name: '찾기' }).click();

    const 행들 = page.getByRole('row').filter({ hasText: 무리 });
    await expect(행들).toHaveCount(2);
    await expect(행들.first()).toContainText(나중);
    await expect(행들.last()).toContainText(먼저);
  });

  test('TG-036 #2: 검색어를 넣으면 그 사용자만 남는다', async ({ page }) => {
    const 표식 = randomUUID().slice(0, 8);
    const email = await 일반_사용자를_만든다(page, 표식);
    await 관리자로_들어간다(page);

    await page.goto('/admin/users');
    await page.locator('#admin-user-search').fill(표식);
    await page.getByRole('button', { name: '찾기' }).click();

    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText('e2e-admin@example.com')).toHaveCount(0);
  });

  test('사용자 자리와 관리 자리를 메뉴 하단의 단추로 오간다', async ({ page }) => {
    await 관리자로_들어간다(page);

    await page.goto('/tasks/all');
    await page.getByRole('link', { name: '관리자 페이지' }).click();

    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByRole('link', { name: '사용자 관리' })).toBeVisible();
    await expect(page.getByRole('link', { name: '알림 문제' })).toBeVisible();
    await expect(page.getByRole('link', { name: '나의 하루' })).toHaveCount(0);

    await page.getByRole('link', { name: '사용자 페이지' }).click();

    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.getByRole('link', { name: '나의 하루' })).toBeVisible();
    await expect(page.getByRole('link', { name: '사용자 관리' })).toHaveCount(0);
  });

  test('알림 문제 자리가 관리 화면에 선다', async ({ page }) => {
    await 관리자로_들어간다(page);

    await page.goto('/admin/notifications');

    await expect(page.getByRole('heading', { name: '알림 문제' })).toBeVisible();
    await expect(page.getByText('알림이 닿지 않은 자리입니다')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '사유' })).toBeVisible();
    await expect(page.getByRole('button', { name: '처리된 것도' })).toBeVisible();
  });
});
