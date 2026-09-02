import { expect, test } from '../fixtures';
import {
  등록하고_들어간다,
  로그아웃한다,
  로그인_전,
  로그인한다,
  비밀번호,
  새_이메일,
} from './account-support';

// 로그인하기
//
// AC3 은 [서버]다. 로그인하지 않은 채로 작업 API 를 부르는 것은 화면이 만들지 않는
// 요청이므로 백엔드 통합 테스트가 갖는다.

test.use(로그인_전);

test.describe('로그인하기', () => {
  test('맞는 자격으로 로그인하면 그 계정의 작업 목록을 보여 준다', async ({ page }) => {
    const email = 새_이메일();
    await 등록하고_들어간다(page, email);
    await 로그아웃한다(page);

    await 로그인한다(page, email, 비밀번호);

    await expect(page).toHaveURL(/\/todo\//);
    await expect(page.getByPlaceholder('작업 추가')).toBeVisible();
  });

  test('자격이 맞지 않으면 어느 쪽이 틀렸는지 구분하지 않고 알린다', async ({
    page,
  }) => {
    const email = 새_이메일();
    await 등록하고_들어간다(page, email);
    await 로그아웃한다(page);

    await 로그인한다(page, email, '틀린-비밀번호-1234');
    const 없는_계정_문구 = await page.getByRole('alert').first().textContent();

    await 로그인한다(page, 새_이메일(), 비밀번호);

    await expect(page.getByRole('alert').first()).toHaveText(없는_계정_문구 ?? '');
  });
});
