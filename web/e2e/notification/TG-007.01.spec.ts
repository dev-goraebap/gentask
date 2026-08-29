import { randomUUID } from 'node:crypto';
import { expect, test } from '../fixtures';
import { 가짜_구독을_만들게_한다, 권한을_정한다, 푸시를_지원하지_않게_한다 } from './push-support';

// TG-007.01 이 기기로 알림 받기
//
// 여기는 화면이 이 기기의 상태를 어떻게 보여 주는가를 다룬다. AC1 과 AC4 와 AC5 의 등록과 해제와
// 여러 기기의 나란한 보관은 서버가 갖는 것이므로 백엔드 통합 테스트에 있다.

test.describe('TG-007.01 이 기기로 알림 받기', () => {
  test('TG-007.01 #2: 등록이 끝나면 이 기기가 알림을 받는 상태임을 보여 준다', async ({ page }) => {
    await 권한을_정한다(page, 'default', 'granted');
    await 가짜_구독을_만들게_한다(page, `https://e2e.example/push/${randomUUID()}`);

    await page.goto('/account');
    await expect(page.getByText('이 기기는 알림을 받지 않습니다.')).toBeVisible();

    await page.getByRole('button', { name: '켜기' }).click();

    // 자리를 서버에 맡기고 돌아온 뒤에야 이 문구가 선다. 등록이 실패하면 문구 대신 알림이 뜬다.
    await expect(page.getByText('이 기기는 알림을 받고 있습니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: '끄기' })).toBeVisible();
  });

  test('TG-007.01 #3: 권한을 거절하면 브라우저 설정에서 다시 허용할 수 있음을 알린다', async ({
    page,
  }) => {
    await 권한을_정한다(page, 'default', 'denied');

    await page.goto('/account');
    await page.getByRole('button', { name: '켜기' }).click();

    await expect(page.getByText('브라우저 설정에서 이 사이트의 알림을 허용')).toBeVisible();
  });

  test('TG-007.01 #6: 웹 푸시를 지원하지 않으면 이 기기에서 받을 수 없음을 알린다', async ({
    page,
  }) => {
    // 권한을 허용으로 두는 것은 그것이 이유가 아님을 못박기 위해서다. 지원 여부가 먼저 갈린다.
    await 권한을_정한다(page, 'granted');
    await 푸시를_지원하지_않게_한다(page);

    await page.goto('/account');

    await expect(page.getByText('이 브라우저는 알림을 지원하지 않습니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: '켜기' })).toHaveCount(0);
  });
});
