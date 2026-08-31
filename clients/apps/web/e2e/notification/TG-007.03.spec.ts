import { expect, test } from '../fixtures';
import { IOS_USER_AGENT, 권한을_정한다, 홈_화면에서_열린_것으로_한다 } from './push-support';

// TG-007.03 홈 화면에 설치하기
//
// AC2 의 iOS 브라우저 탭 안내는 실기기에서 확인한다. 설치 자체는 브라우저가 주도하며 자동화가
// 대신 누를 수 없으므로, 홈 화면에서 열린 자리는 그 신호를 흉내 내어 확인한다.

interface 매니페스트 {
  readonly display: string;
  readonly start_url: string;
  readonly scope: string;
  readonly icons: readonly { readonly src: string; readonly sizes: string }[];
}

test.describe('TG-007.03 홈 화면에 설치하기', () => {
  test('TG-007.03 #1: 홈 화면에 추가할 자리를 주소창 없이 열도록 정하고 그 아이콘을 낸다', async ({
    page,
  }) => {
    await page.goto('/account');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      /manifest\.webmanifest$/,
    );

    const 응답 = await page.request.get('/manifest.webmanifest');
    expect(응답.status(), '매니페스트를 받지 못했습니다').toBe(200);

    const 매니페스트 = (await 응답.json()) as 매니페스트;
    // standalone 이 주소창 없이 여는 표시다. 그 값이 아니면 아이콘으로 열어도 탭으로 열린다.
    expect(매니페스트.display).toBe('standalone');
    expect(매니페스트.start_url).toBe('/');
    expect(매니페스트.scope).toBe('/');
    expect(매니페스트.icons.length).toBeGreaterThan(0);

    for (const 아이콘 of 매니페스트.icons) {
      const 아이콘응답 = await page.request.get(`/${아이콘.src}`);
      expect(아이콘응답.status(), `${아이콘.src} 를 받지 못했습니다`).toBe(200);
    }

    // iOS 는 매니페스트의 icons 를 읽지 않고 이 자리만 본다. 없으면 홈 화면 아이콘이 빈다.
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', /\.png$/);
    const 애플아이콘 = await page.request.get('/apple-touch-icon.png');
    expect(애플아이콘.status(), 'apple-touch-icon 을 받지 못했습니다').toBe(200);
  });

  test.describe('iOS 에서 열었을 때', () => {
    test.use({ userAgent: IOS_USER_AGENT });

    test('TG-007.03 #3: 이미 홈 화면에서 열린 상태이면 그 안내를 보여 주지 않는다', async ({
      page,
    }) => {
      // 권한을 물음 전으로 두는 것은 안내가 사라진 뒤 무엇이 서는지 보기 위해서다. 거절 상태로
      // 두면 안내가 사라진 이유가 설치인지 권한인지 갈리지 않는다.
      await 권한을_정한다(page, 'default');

      // 흉내가 듣는지 먼저 확인한다. 안내가 애초에 나오지 않는 자리라면 뒤의 단언이 아무것도 재지
      // 못하고 통과한다.
      await page.goto('/account');
      await expect(page.getByText('홈 화면에 생긴 아이콘으로 다시 엽니다')).toBeVisible();

      await 홈_화면에서_열린_것으로_한다(page);
      await page.reload();

      await expect(page.getByText('홈 화면에 생긴 아이콘으로 다시 엽니다')).toHaveCount(0);
      await expect(page.getByText('이 기기는 알림을 받지 않습니다.')).toBeVisible();
    });
  });
});
